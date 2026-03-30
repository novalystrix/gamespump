import { NextResponse } from 'next/server';
import { submitWordBlitzWord } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, word, round } = await request.json();
    if (!playerId || !word || round === undefined) {
      return NextResponse.json({ error: 'playerId, word, and round required' }, { status: 400 });
    }
    const result = submitWordBlitzWord(params.code, playerId, word, round);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Cannot submit word' }, { status: 400 });
    }
    return NextResponse.json({ success: true, pointsGained: result.pointsGained });
  } catch {
    return NextResponse.json({ error: 'Failed to submit word' }, { status: 500 });
  }
}
