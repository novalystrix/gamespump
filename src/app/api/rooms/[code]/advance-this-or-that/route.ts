import { NextResponse } from 'next/server';
import { advanceThisOrThatRound, forceThisOrThatResults } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { action } = await request.json();

    if (action === 'force-results') {
      const room = forceThisOrThatResults(params.code);
      if (!room) {
        return NextResponse.json({ error: 'Cannot force results' }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    const room = advanceThisOrThatRound(params.code);
    if (!room) {
      return NextResponse.json({ error: 'Cannot advance round' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to advance' }, { status: 500 });
  }
}
