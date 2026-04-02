import { NextResponse } from 'next/server';
import { submitCharadesClue } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, clue } = await request.json();
    if (!playerId || !clue) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const success = submitCharadesClue(params.code, playerId, clue);
    if (!success) {
      return NextResponse.json({ error: 'Cannot submit clue' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to submit clue' }, { status: 500 });
  }
}
