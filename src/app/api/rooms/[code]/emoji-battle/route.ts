import { NextResponse } from 'next/server';
import { submitEmojiBattleAnswer } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, roundIndex, emojiIndex } = await request.json();
    if (!playerId || roundIndex === undefined || emojiIndex === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const room = submitEmojiBattleAnswer(params.code, playerId, roundIndex, emojiIndex);
    if (!room) {
      return NextResponse.json({ error: 'Failed' }, { status: 400 });
    }
    return NextResponse.json({ room });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
