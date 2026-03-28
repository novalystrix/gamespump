import { NextResponse } from 'next/server';
import { submitVote } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, choice } = await request.json();
    if (!playerId || !choice || !['A', 'B'].includes(choice)) {
      return NextResponse.json({ error: 'playerId and choice (A or B) required' }, { status: 400 });
    }

    const room = submitVote(params.code, playerId, choice);
    if (!room) {
      return NextResponse.json({ error: 'Cannot submit vote' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
  }
}
