'use client';

// Lightweight client-side analytics for GamesPump
// Zero deps, no PII, localStorage-based

const EVENTS_KEY = 'gamespump_events';
const VISITOR_KEY = 'gamespump_visitor_id';
const SESSION_KEY = 'gamespump_session_id';
const SESSION_START_KEY = 'gamespump_session_start';
const MAX_EVENTS = 500;

interface AnalyticsEvent {
  type: string;
  data?: Record<string, string | number | boolean>;
  ts: number;
  visitorId: string;
  sessionId: string;
}

function getOrCreateId(key: string): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function getVisitorId(): string {
  return getOrCreateId(VISITOR_KEY);
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  const start = localStorage.getItem(SESSION_START_KEY);
  const now = Date.now();
  // Session expires after 30 min of inactivity
  if (!start || now - parseInt(start) > 30 * 60 * 1000) {
    const sid = `s_${now}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(SESSION_KEY, sid);
    localStorage.setItem(SESSION_START_KEY, String(now));
    return sid;
  }
  // Refresh session timer
  localStorage.setItem(SESSION_START_KEY, String(now));
  return localStorage.getItem(SESSION_KEY) || '';
}

function pushEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;
  try {
    const events: AnalyticsEvent[] = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    events.push(event);
    // Keep last N events
    const trimmed = events.slice(-MAX_EVENTS);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
  } catch {}
}

function track(type: string, data?: Record<string, string | number | boolean>): void {
  pushEvent({
    type,
    data,
    ts: Date.now(),
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
  });
}

// ── Public API ──────────────────────────────────────────────────────────

export function trackPageView(page: string): void {
  track('page_view', { page });
}

export function trackRoomCreated(roomCode: string, gameId?: string): void {
  track('room_created', { roomCode, ...(gameId ? { gameId } : {}) });
}

export function trackRoomJoined(roomCode: string): void {
  track('room_joined', { roomCode });
}

export function trackGameStart(gameId: string, playerCount: number): void {
  track('game_start', { gameId, playerCount });
}

export function trackGameEnd(gameType: string, score: number, roomCode: string): void {
  track('game_end', { gameType, score, roomCode });
}

export function trackShare(method: string, gameName: string): void {
  track('share', { method, gameName });
}

// ── Stats Aggregation (for admin dashboard) ─────────────────────────────

export interface AnalyticsStats {
  totalEvents: number;
  uniqueVisitors: number;
  totalSessions: number;
  pageViews: Record<string, number>;
  gamesStarted: Record<string, number>;
  gamesCompleted: Record<string, number>;
  shares: number;
  roomsCreated: number;
  roomsJoined: number;
  returnRate: number; // % of visitors with 2+ sessions
  eventsByHour: Record<number, number>;
}

export function getAnalyticsStats(): AnalyticsStats {
  if (typeof window === 'undefined') {
    return {
      totalEvents: 0, uniqueVisitors: 0, totalSessions: 0,
      pageViews: {}, gamesStarted: {}, gamesCompleted: {},
      shares: 0, roomsCreated: 0, roomsJoined: 0, returnRate: 0, eventsByHour: {},
    };
  }

  const events: AnalyticsEvent[] = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
  const visitors = new Set<string>();
  const sessions = new Set<string>();
  const visitorSessions: Record<string, Set<string>> = {};
  const pageViews: Record<string, number> = {};
  const gamesStarted: Record<string, number> = {};
  const gamesCompleted: Record<string, number> = {};
  const eventsByHour: Record<number, number> = {};
  let shares = 0, roomsCreated = 0, roomsJoined = 0;

  for (const e of events) {
    visitors.add(e.visitorId);
    sessions.add(e.sessionId);
    
    if (!visitorSessions[e.visitorId]) visitorSessions[e.visitorId] = new Set();
    visitorSessions[e.visitorId].add(e.sessionId);

    const hour = new Date(e.ts).getHours();
    eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;

    switch (e.type) {
      case 'page_view':
        const page = String(e.data?.page || 'unknown');
        pageViews[page] = (pageViews[page] || 0) + 1;
        break;
      case 'game_start':
        const gid = String(e.data?.gameId || 'unknown');
        gamesStarted[gid] = (gamesStarted[gid] || 0) + 1;
        break;
      case 'game_end':
        const gt = String(e.data?.gameType || 'unknown');
        gamesCompleted[gt] = (gamesCompleted[gt] || 0) + 1;
        break;
      case 'share':
        shares++;
        break;
      case 'room_created':
        roomsCreated++;
        break;
      case 'room_joined':
        roomsJoined++;
        break;
    }
  }

  const returningVisitors = Object.values(visitorSessions).filter(s => s.size >= 2).length;
  const returnRate = visitors.size > 0 ? (returningVisitors / visitors.size) * 100 : 0;

  return {
    totalEvents: events.length,
    uniqueVisitors: visitors.size,
    totalSessions: sessions.size,
    pageViews,
    gamesStarted,
    gamesCompleted,
    shares,
    roomsCreated,
    roomsJoined,
    returnRate,
    eventsByHour,
  };
}
