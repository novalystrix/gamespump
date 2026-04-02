'use client';

// GamesPump Analytics — lightweight client-side event tracking
// No external deps, no PII, localStorage-based with optional server push

const ANALYTICS_KEY = 'gamespump_analytics';
const VISITOR_KEY = 'gamespump_visitor_id';
const SESSION_KEY = 'gamespump_analytics_session';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min inactivity = new session

// ── Types ──────────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  event: string;
  props?: Record<string, string | number | boolean>;
  ts: number;
  sessionId: string;
  visitorId: string;
}

export interface AnalyticsSnapshot {
  totalEvents: number;
  uniqueVisitors: number;
  totalSessions: number;
  pageViews: Record<string, number>;
  gameStarts: Record<string, number>;
  gameCompletions: Record<string, number>;
  avgPlayersPerGame: Record<string, number>;
  returnVisitRate: number; // % of visitors with 2+ sessions
  eventsByDay: Record<string, number>;
  topDropOffPoints: { event: string; count: number }[];
  recentEvents: AnalyticsEvent[];
}

// ── Visitor & Session ──────────────────────────────────────────────────

function getVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const sess = JSON.parse(raw);
      if (Date.now() - sess.lastActive < SESSION_TIMEOUT) {
        sess.lastActive = Date.now();
        localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
        return sess.id;
      }
    }
  } catch {}
  // New session
  const sess = {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    lastActive: Date.now(),
    startedAt: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
  return sess.id;
}

// ── Core ───────────────────────────────────────────────────────────────

function getEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(ANALYTICS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: AnalyticsEvent[]): void {
  if (typeof window === 'undefined') return;
  // Keep last 500 events to avoid localStorage bloat
  const trimmed = events.slice(-500);
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function track(event: string, props?: Record<string, string | number | boolean>): void {
  if (typeof window === 'undefined') return;
  const ev: AnalyticsEvent = {
    event,
    props,
    ts: Date.now(),
    sessionId: getSessionId(),
    visitorId: getVisitorId(),
  };
  const events = getEvents();
  events.push(ev);
  saveEvents(events);
}

// ── Convenience Helpers ────────────────────────────────────────────────

export function trackPageView(page: string): void {
  track('page_view', { page });
}

export function trackGameStart(gameType: string, playerCount: number, roomCode: string): void {
  track('game_start', { gameType, playerCount, roomCode });
}

export function trackGameEnd(gameType: string, playerCount: number, roomCode: string, completed: boolean): void {
  track('game_end', { gameType, playerCount, roomCode, completed });
}

export function trackRoomCreated(roomCode: string): void {
  track('room_created', { roomCode });
}

export function trackRoomJoined(roomCode: string): void {
  track('room_joined', { roomCode });
}

export function trackRoundComplete(gameType: string, round: number, totalRounds: number): void {
  track('round_complete', { gameType, round, totalRounds });
}

export function trackShare(method: string, gameType?: string): void {
  track('share', { method, gameType: gameType ?? 'unknown' });
}

// ── Server sync helpers ────────────────────────────────────────────────

const SENT_INDEX_KEY = 'gamespump_analytics_sent_idx';

export function getUnsentEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  const events = getEvents();
  try {
    const idx = parseInt(localStorage.getItem(SENT_INDEX_KEY) ?? '0', 10);
    return events.slice(idx);
  } catch {
    return events;
  }
}

export function markEventsSent(count: number): void {
  if (typeof window === 'undefined') return;
  try {
    const idx = parseInt(localStorage.getItem(SENT_INDEX_KEY) ?? '0', 10);
    localStorage.setItem(SENT_INDEX_KEY, String(idx + count));
  } catch {}
}

// ── Aggregation (for admin stats page) ─────────────────────────────────

export function getAnalyticsSnapshot(): AnalyticsSnapshot {
  const events = getEvents();

  const visitors = new Set<string>();
  const sessions = new Set<string>();
  const visitorSessions: Record<string, Set<string>> = {};
  const pageViews: Record<string, number> = {};
  const gameStarts: Record<string, number> = {};
  const gameCompletions: Record<string, number> = {};
  const gamePlayerCounts: Record<string, number[]> = {};
  const eventsByDay: Record<string, number> = {};

  for (const ev of events) {
    visitors.add(ev.visitorId);
    sessions.add(ev.sessionId);

    if (!visitorSessions[ev.visitorId]) visitorSessions[ev.visitorId] = new Set();
    visitorSessions[ev.visitorId].add(ev.sessionId);

    const day = new Date(ev.ts).toISOString().slice(0, 10);
    eventsByDay[day] = (eventsByDay[day] || 0) + 1;

    if (ev.event === 'page_view' && ev.props?.page) {
      const page = String(ev.props.page);
      pageViews[page] = (pageViews[page] || 0) + 1;
    }

    if (ev.event === 'game_start' && ev.props?.gameType) {
      const gt = String(ev.props.gameType);
      gameStarts[gt] = (gameStarts[gt] || 0) + 1;
      if (ev.props.playerCount) {
        if (!gamePlayerCounts[gt]) gamePlayerCounts[gt] = [];
        gamePlayerCounts[gt].push(Number(ev.props.playerCount));
      }
    }

    if (ev.event === 'game_end' && ev.props?.gameType && ev.props?.completed) {
      const gt = String(ev.props.gameType);
      gameCompletions[gt] = (gameCompletions[gt] || 0) + 1;
    }
  }

  const avgPlayersPerGame: Record<string, number> = {};
  for (const [gt, counts] of Object.entries(gamePlayerCounts)) {
    avgPlayersPerGame[gt] = Math.round((counts.reduce((a, b) => a + b, 0) / counts.length) * 10) / 10;
  }

  const returnVisitors = Object.values(visitorSessions).filter(s => s.size >= 2).length;
  const returnVisitRate = visitors.size > 0 ? Math.round((returnVisitors / visitors.size) * 100) : 0;

  // Drop-off: games started but not completed
  const dropOffs: { event: string; count: number }[] = [];
  for (const gt of Object.keys(gameStarts)) {
    const started = gameStarts[gt] || 0;
    const completed = gameCompletions[gt] || 0;
    const dropped = started - completed;
    if (dropped > 0) {
      dropOffs.push({ event: `${gt} (${dropped}/${started} abandoned)`, count: dropped });
    }
  }
  dropOffs.sort((a, b) => b.count - a.count);

  return {
    totalEvents: events.length,
    uniqueVisitors: visitors.size,
    totalSessions: sessions.size,
    pageViews,
    gameStarts,
    gameCompletions,
    avgPlayersPerGame,
    returnVisitRate,
    eventsByDay,
    topDropOffPoints: dropOffs.slice(0, 5),
    recentEvents: events.slice(-20).reverse(),
  };
}
