import { NextResponse } from 'next/server';
import { flipCard } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, cardIndex } = await request.json();
    if (!playerId || cardIndex === undefined) {
      return NextResponse.json({ error: 'playerId and cardIndex required' }, { status: 400 });
    }

    const room = flipCard(params.code, playerId, cardIndex);
    if (!room) {
      return NextResponse.json({ error: 'Cannot flip card' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to flip card' }, { status: 500 });
  }
}
