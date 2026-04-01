import { NextResponse } from 'next/server';
import { submitReaction, advanceReactionRound, forceReactionResults } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, action } = await request.json();
    if (!playerId || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    let room;
    switch (action) {
      case 'react':
        room = submitReaction(params.code, playerId);
        break;
      case 'advance':
        room = advanceReactionRound(params.code);
        break;
      case 'force-results':
        room = forceReactionResults(params.code);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!room) {
      return NextResponse.json({ error: 'Failed' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
