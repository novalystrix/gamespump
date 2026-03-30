import { NextResponse } from 'next/server';
import { advanceQuickDrawRound, forceQuickDrawResults } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { action } = await request.json();

    if (action === 'force-results') {
      const room = forceQuickDrawResults(params.code);
      if (!room) {
        return NextResponse.json({ error: 'Cannot force results' }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    const room = advanceQuickDrawRound(params.code);
    if (!room) {
      return NextResponse.json({ error: 'Cannot advance' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to advance' }, { status: 500 });
  }
}
