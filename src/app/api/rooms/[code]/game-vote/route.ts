import { NextResponse } from 'next/server';
import { voteForGame } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, gameId } = await request.json();
    if (!playerId || !gameId) {
      return NextResponse.json({ error: 'playerId and gameId required' }, { status: 400 });
    }
    const room = voteForGame(params.code, playerId, gameId);
    if (!room) {
      return NextResponse.json({ error: 'Cannot vote' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
