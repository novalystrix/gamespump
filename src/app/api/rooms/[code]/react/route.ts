import { NextResponse } from 'next/server';
import { addReaction } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, emoji } = await request.json();
    if (!playerId || !emoji) {
      return NextResponse.json({ error: 'playerId and emoji required' }, { status: 400 });
    }

    const room = addReaction(params.code, playerId, emoji);
    if (!room) {
      return NextResponse.json({ error: 'Cannot add reaction' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 });
  }
}
