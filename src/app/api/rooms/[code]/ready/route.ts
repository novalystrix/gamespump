import { NextResponse } from 'next/server';
import { setPlayerReady } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, ready } = await request.json();
    if (!playerId) {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 });
    }

    const room = setPlayerReady(params.code, playerId, ready ?? true);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch {
    return NextResponse.json({ error: 'Failed to update ready status' }, { status: 500 });
  }
}
