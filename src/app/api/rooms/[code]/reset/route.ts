import { NextResponse } from 'next/server';
import { resetToLobby } from '@/lib/rooms';

export async function POST(
  _request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const room = resetToLobby(params.code);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch {
    return NextResponse.json({ error: 'Failed to reset' }, { status: 500 });
  }
}
