import { NextResponse } from 'next/server';
import { joinRoom } from '@/lib/rooms';
import { Player } from '@/lib/types';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const body = await request.json();
    const player: Player = {
      id: body.id,
      name: body.name,
      avatar: body.avatar,
      color: body.color,
      isHost: body.isHost || false,
      isReady: body.isReady || false,
      joinedAt: Date.now(),
    };

    if (!player.id || !player.name) {
      return NextResponse.json({ error: 'id and name required' }, { status: 400 });
    }

    const room = joinRoom(params.code, player);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch {
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
