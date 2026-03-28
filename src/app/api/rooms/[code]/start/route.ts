import { NextResponse } from 'next/server';
import { startGame } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId } = await request.json();
    if (!playerId) {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 });
    }

    const room = startGame(params.code, playerId);
    if (!room) {
      return NextResponse.json({ error: 'Cannot start game' }, { status: 400 });
    }

    return NextResponse.json({ room });
  } catch {
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 });
  }
}
