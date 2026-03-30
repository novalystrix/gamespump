import { NextResponse } from 'next/server';
import { updateQuickDrawCanvas } from '@/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { playerId, canvasData } = await request.json();
    if (!playerId || !canvasData) {
      return NextResponse.json({ error: 'playerId and canvasData required' }, { status: 400 });
    }
    const success = updateQuickDrawCanvas(params.code, playerId, canvasData);
    if (!success) {
      return NextResponse.json({ error: 'Cannot update canvas' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update canvas' }, { status: 500 });
  }
}
