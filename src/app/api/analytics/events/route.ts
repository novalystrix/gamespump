import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { AnalyticsEvent } from '@/lib/analytics';

const ALLOWED_EVENTS = new Set([
  'page_view', 'game_start', 'game_end', 'room_created',
  'room_joined', 'round_complete', 'share',
]);

const MAX_BATCH = 50;
const MAX_PAYLOAD_BYTES = 10 * 1024; // 10KB

// In-memory rate limiter: ip_hash -> { count, windowStart }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

let tableEnsured = false;

async function ensureTable() {
  if (tableEnsured) return;
  await query(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id SERIAL PRIMARY KEY,
      event VARCHAR(50) NOT NULL,
      props JSONB DEFAULT '{}',
      visitor_id VARCHAR(64) NOT NULL,
      session_id VARCHAR(64) NOT NULL,
      ip_hash VARCHAR(64),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event);
    CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_visitor ON analytics_events(visitor_id);
  `);
  tableEnsured = true;
}

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  );
}

function isRateLimited(ipHash: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ipHash);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ipHash, { count: 1, windowStart: now });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

function isValidProps(props: unknown): boolean {
  if (!props || typeof props !== 'object' || Array.isArray(props)) return true;
  return Object.values(props as Record<string, unknown>).every(
    v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
  );
}

export async function POST(req: NextRequest) {
  // Payload size check
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  const ip = getIP(req);
  const ipHash = await hashIP(ip);

  if (isRateLimited(ipHash)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || !Array.isArray((body as { events?: unknown }).events)) {
    return NextResponse.json({ error: 'events array required' }, { status: 400 });
  }

  const { events } = body as { events: unknown[] };

  if (events.length > MAX_BATCH) {
    return NextResponse.json({ error: `Max ${MAX_BATCH} events per batch` }, { status: 400 });
  }

  // Validate each event
  const validEvents: AnalyticsEvent[] = [];
  for (const ev of events) {
    if (!ev || typeof ev !== 'object') continue;
    const e = ev as Partial<AnalyticsEvent>;
    if (!e.type || !ALLOWED_EVENTS.has(e.type)) continue;
    if (!e.visitorId || !e.sessionId || !e.ts) continue;
    if (!isValidProps(e.data)) continue;
    validEvents.push(e as AnalyticsEvent);
  }

  if (validEvents.length === 0) {
    return NextResponse.json({ ok: true, count: 0 });
  }

  try {
    await ensureTable();

    for (const ev of validEvents) {
      await query(
        `INSERT INTO analytics_events (event, props, visitor_id, session_id, ip_hash)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          ev.type,
          JSON.stringify(ev.data ?? {}),
          ev.visitorId,
          ev.sessionId,
          ipHash,
        ]
      );
    }

    return NextResponse.json({ ok: true, count: validEvents.length });
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
