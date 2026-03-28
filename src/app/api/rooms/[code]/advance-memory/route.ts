import { NextResponse } from 'next/server';
import { advanceMemoryTurn } from '@/lib/rooms';

export async function POST(
  _request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const room = advanceMemoryTurn(params.code);
    if (!room) {
      return NextResponse.json({ error: 'Cannot advance turn' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to advance' }, { status: 500 });
  }
}
