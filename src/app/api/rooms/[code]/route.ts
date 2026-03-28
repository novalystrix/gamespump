import { NextResponse } from 'next/server';
import { getRoom } from '@/lib/rooms';

export async function GET(
  _request: Request,
  { params }: { params: { code: string } }
) {
  const room = getRoom(params.code);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  return NextResponse.json({ room });
}
