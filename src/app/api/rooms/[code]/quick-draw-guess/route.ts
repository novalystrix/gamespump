import { NextResponse } from 'next/server';
import { submitQuickDrawGuess } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, guess } = await request.json();
    if (!playerId || !guess) {
      return NextResponse.json({ error: 'playerId and guess required' }, { status: 400 });
    }
    const result = submitQuickDrawGuess(params.code, playerId, guess);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Cannot submit guess' }, { status: 400 });
    }
    return NextResponse.json({ success: true, correct: result.correct, points: result.points });
  } catch {
    return NextResponse.json({ error: 'Failed to submit guess' }, { status: 500 });
  }
}
