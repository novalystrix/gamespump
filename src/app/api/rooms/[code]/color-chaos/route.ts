import { NextResponse } from 'next/server';
import { submitColorChaosAnswer, advanceColorChaosRound, forceColorChaosResults } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, action, answerIndex, roundIndex } = await request.json();
    if (!playerId || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    let room;
    switch (action) {
      case 'answer':
        if (roundIndex === undefined || answerIndex === undefined) {
          return NextResponse.json({ error: 'Missing answerIndex or roundIndex' }, { status: 400 });
        }
        room = submitColorChaosAnswer(params.code, playerId, roundIndex, answerIndex);
        break;
      case 'advance':
        room = advanceColorChaosRound(params.code);
        break;
      case 'force-results':
        room = forceColorChaosResults(params.code);
        break;
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    if (!room) {
      return NextResponse.json({ error: 'Failed' }, { status: 400 });
    }
    return NextResponse.json({ room });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
