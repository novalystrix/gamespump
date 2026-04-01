import { NextResponse } from 'next/server';
import { submitStatement, submitLieDetectorVote, forceLieDetectorVoting, advanceLieDetectorPhase } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const body = await request.json();
    const { playerId, action, statement, isTrue, vote } = body;

    switch (action) {
      case 'submit-statement': {
        if (!playerId || !statement || typeof isTrue !== 'boolean') {
          return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const room = submitStatement(params.code, playerId, statement, isTrue);
        if (!room) {
          return NextResponse.json({ error: 'Cannot submit statement' }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      }

      case 'vote': {
        if (!playerId || !vote) {
          return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const room = submitLieDetectorVote(params.code, playerId, vote);
        if (!room) {
          return NextResponse.json({ error: 'Cannot vote' }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      }

      case 'force-voting': {
        const room = forceLieDetectorVoting(params.code);
        if (!room) {
          return NextResponse.json({ error: 'Cannot force voting' }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      }

      case 'advance': {
        const room = advanceLieDetectorPhase(params.code);
        if (!room) {
          return NextResponse.json({ error: 'Cannot advance' }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
