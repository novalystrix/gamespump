import { NextResponse } from 'next/server';
import { getRoom } from '@/lib/rooms';

export async function GET(
  _request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const room = getRoom(params.code);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (!room.gameState) {
      return NextResponse.json({ error: 'No active game' }, { status: 400 });
    }

    const gs = room.gameState;
    const currentQ = gs.questions[gs.currentQuestion];

    // Don't send correct answer during question phase
    const safeQuestion = gs.phase === 'question'
      ? { question: currentQ.question, options: currentQ.options, category: currentQ.category }
      : { question: currentQ.question, options: currentQ.options, category: currentQ.category, correctIndex: currentQ.correctIndex };

    return NextResponse.json({
      phase: gs.phase,
      currentQuestion: gs.currentQuestion,
      totalQuestions: gs.questions.length,
      question: safeQuestion,
      answers: gs.phase === 'question' ? Object.keys(gs.answers) : gs.answers,
      scores: gs.scores,
      questionStartedAt: gs.questionStartedAt,
      players: room.players,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to get game state' }, { status: 500 });
  }
}
