import { NextResponse } from 'next/server';
import { createRoom } from '@/lib/rooms';

export async function POST(request: Request) {
  try {
    const { hostId, locale } = await request.json();
    if (!hostId) {
      return NextResponse.json({ error: 'hostId required' }, { status: 400 });
    }
    const room = createRoom(hostId, locale);
    return NextResponse.json({ code: room.code, room });
  } catch {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
