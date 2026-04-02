import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [totals, pageViews, gameStarts, gameEnds, byDay] = await Promise.all([
      query<{ total_events: string; unique_visitors: string; total_sessions: string }>(`
        SELECT
          COUNT(*) AS total_events,
          COUNT(DISTINCT visitor_id) AS unique_visitors,
          COUNT(DISTINCT session_id) AS total_sessions
        FROM analytics_events
        WHERE created_at >= $1
      `, [since]),

      query<{ page: string; cnt: string }>(`
        SELECT props->>'page' AS page, COUNT(*) AS cnt
        FROM analytics_events
        WHERE event = 'page_view' AND created_at >= $1 AND props->>'page' IS NOT NULL
        GROUP BY page
        ORDER BY cnt DESC
      `, [since]),

      query<{ game_type: string; cnt: string; avg_players: string }>(`
        SELECT
          props->>'gameType' AS game_type,
          COUNT(*) AS cnt,
          AVG((props->>'playerCount')::numeric) AS avg_players
        FROM analytics_events
        WHERE event = 'game_start' AND created_at >= $1 AND props->>'gameType' IS NOT NULL
        GROUP BY game_type
        ORDER BY cnt DESC
      `, [since]),

      query<{ game_type: string; cnt: string }>(`
        SELECT props->>'gameType' AS game_type, COUNT(*) AS cnt
        FROM analytics_events
        WHERE event = 'game_end' AND created_at >= $1
          AND props->>'gameType' IS NOT NULL
          AND (props->>'completed')::boolean = true
        GROUP BY game_type
      `, [since]),

      query<{ day: string; cnt: string }>(`
        SELECT DATE(created_at) AS day, COUNT(*) AS cnt
        FROM analytics_events
        WHERE created_at >= $1
        GROUP BY day
        ORDER BY day DESC
      `, [since]),
    ]);

    // Return visit rate: visitors with 2+ distinct sessions
    const returnVisitData = await query<{ return_visitors: string; total_visitors: string }>(`
      SELECT
        COUNT(*) FILTER (WHERE session_count >= 2) AS return_visitors,
        COUNT(*) AS total_visitors
      FROM (
        SELECT visitor_id, COUNT(DISTINCT session_id) AS session_count
        FROM analytics_events
        WHERE created_at >= $1
        GROUP BY visitor_id
      ) v
    `, [since]);

    const t = totals.rows[0];
    const rv = returnVisitData.rows[0];

    const gameStartsMap: Record<string, number> = {};
    const avgPlayersMap: Record<string, number> = {};
    for (const row of gameStarts.rows) {
      gameStartsMap[row.game_type] = parseInt(row.cnt);
      if (row.avg_players) {
        avgPlayersMap[row.game_type] = Math.round(parseFloat(row.avg_players) * 10) / 10;
      }
    }

    const gameCompletionsMap: Record<string, number> = {};
    for (const row of gameEnds.rows) {
      gameCompletionsMap[row.game_type] = parseInt(row.cnt);
    }

    // Drop-offs
    const dropOffs: { event: string; count: number }[] = [];
    for (const [gt, started] of Object.entries(gameStartsMap)) {
      const completed = gameCompletionsMap[gt] || 0;
      const dropped = started - completed;
      if (dropped > 0) {
        dropOffs.push({ event: `${gt} (${dropped}/${started} abandoned)`, count: dropped });
      }
    }
    dropOffs.sort((a, b) => b.count - a.count);

    const totalVisitors = parseInt(rv?.total_visitors ?? '0');
    const returnVisitors = parseInt(rv?.return_visitors ?? '0');
    const returnVisitRate = totalVisitors > 0 ? Math.round((returnVisitors / totalVisitors) * 100) : 0;

    return NextResponse.json({
      totalEvents: parseInt(t?.total_events ?? '0'),
      uniqueVisitors: parseInt(t?.unique_visitors ?? '0'),
      totalSessions: parseInt(t?.total_sessions ?? '0'),
      pageViews: Object.fromEntries(pageViews.rows.map(r => [r.page, parseInt(r.cnt)])),
      gameStarts: gameStartsMap,
      gameCompletions: gameCompletionsMap,
      avgPlayersPerGame: avgPlayersMap,
      returnVisitRate,
      eventsByDay: Object.fromEntries(byDay.rows.map(r => [r.day, parseInt(r.cnt)])),
      topDropOffPoints: dropOffs.slice(0, 5),
    });
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
