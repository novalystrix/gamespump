import { NextResponse } from 'next/server';
import { leaveRoom } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId } = await request.json();
    if (!playerId) {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 });
    }

    const room = leaveRoom(params.code, playerId);
    return NextResponse.json({ room });
  } catch {
    return NextResponse.json({ error: 'Failed to leave room' }, { status: 500 });
  }
}
