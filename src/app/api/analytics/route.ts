import { NextRequest, NextResponse } from 'next/server';

// Server-side analytics ingestion
// Events are logged to stdout as structured JSON — captured by Render logs
// No DB needed; query via Render log explorer or pipe to a log drain later

interface AnalyticsEvent {
  type: string;
  data?: Record<string, string | number | boolean>;
  ts: number;
  visitorId: string;
  sessionId: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events: AnalyticsEvent[] = Array.isArray(body.events) ? body.events : [];

    if (events.length === 0) {
      return NextResponse.json({ ok: true, ingested: 0 });
    }

    // Cap batch size to prevent abuse
    const batch = events.slice(0, 100);

    for (const event of batch) {
      // Structured log line — one JSON object per event
      // Prefixed with [ANALYTICS] for easy grep in Render logs
      console.log(
        JSON.stringify({
          _tag: 'ANALYTICS',
          type: event.type,
          data: event.data || {},
          ts: event.ts,
          visitorId: event.visitorId?.slice(0, 30) || '',
          sessionId: event.sessionId?.slice(0, 30) || '',
          serverTs: Date.now(),
        })
      );
    }

    return NextResponse.json({ ok: true, ingested: batch.length });
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid payload' }, { status: 400 });
  }
}
