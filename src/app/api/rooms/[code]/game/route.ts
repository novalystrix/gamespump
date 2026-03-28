import { NextResponse } from 'next/server';
import { setSelectedGame } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { gameId } = await request.json();
    if (!gameId) {
      return NextResponse.json({ error: 'gameId required' }, { status: 400 });
    }

    const room = setSelectedGame(params.code, gameId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch {
    return NextResponse.json({ error: 'Failed to select game' }, { status: 500 });
  }
}
