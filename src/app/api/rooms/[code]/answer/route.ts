import { NextResponse } from 'next/server';
import { submitAnswer } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, questionIndex, answerIndex } = await request.json();
    if (!playerId || questionIndex === undefined || answerIndex === undefined) {
      return NextResponse.json({ error: 'playerId, questionIndex, and answerIndex required' }, { status: 400 });
    }

    const room = submitAnswer(params.code, playerId, questionIndex, answerIndex);
    if (!room) {
      return NextResponse.json({ error: 'Cannot submit answer' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 });
  }
}
