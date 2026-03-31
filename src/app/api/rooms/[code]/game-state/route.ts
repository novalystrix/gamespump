import { NextResponse } from 'next/server';
import { getRoom, advanceEmojiBattle } from '@/lib/rooms';
import { TriviaGameState, MemoryMatchGameState, ThisOrThatGameState, SpeedMathGameState, WordBlitzGameState, QuickDrawGameState, EmojiBattleGameState } from '@/lib/types';

export async function GET(
  request: Request,
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

    switch (gs.type) {
      case 'trivia-clash': {
        const tgs = gs as TriviaGameState;
        const currentQ = tgs.questions[tgs.currentQuestion];
        const safeQuestion = tgs.phase === 'question'
          ? { question: currentQ.question, options: currentQ.options, category: currentQ.category }
          : { question: currentQ.question, options: currentQ.options, category: currentQ.category, correctIndex: currentQ.correctIndex };

        const recentReactions = tgs.reactions.filter(r => Date.now() - r.at < 4000);

        return NextResponse.json({
          gameType: 'trivia-clash',
          phase: tgs.phase,
          currentQuestion: tgs.currentQuestion,
          totalQuestions: tgs.questions.length,
          question: safeQuestion,
          answers: tgs.phase === 'question' ? Object.keys(tgs.answers) : tgs.answers,
          scores: tgs.scores,
          questionStartedAt: tgs.questionStartedAt,
          players: room.players,
          reactions: recentReactions,
        });
      }

      case 'memory-match': {
        const mgs = gs as MemoryMatchGameState;
        // Hide unflipped card symbols for fair play
        const safeBoard = mgs.board.map(card => ({
          id: card.id,
          symbol: (card.flipped || card.matched) ? card.symbol : null,
          flipped: card.flipped,
          matched: card.matched,
          matchedBy: card.matchedBy,
        }));

        return NextResponse.json({
          gameType: 'memory-match',
          board: safeBoard,
          currentPlayerId: mgs.currentPlayerId,
          turnPhase: mgs.turnPhase,
          firstPick: mgs.firstPick,
          secondPick: mgs.secondPick,
          scores: mgs.scores,
          phase: mgs.phase,
          showingResultUntil: mgs.showingResultUntil,
          players: room.players,
        });
      }

      case 'this-or-that': {
        const tgs = gs as ThisOrThatGameState;
        const currentRound = tgs.rounds[tgs.currentRound];

        return NextResponse.json({
          gameType: 'this-or-that',
          phase: tgs.phase,
          currentRound: tgs.currentRound,
          totalRounds: tgs.rounds.length,
          round: {
            question: currentRound.question,
            optionA: currentRound.optionA,
            optionB: currentRound.optionB,
            category: currentRound.category,
          },
          answers: tgs.phase === 'voting' ? Object.keys(tgs.answers) : tgs.answers,
          scores: tgs.scores,
          roundStartedAt: tgs.roundStartedAt,
          players: room.players,
        });
      }

      case 'speed-math': {
        const sgs = gs as SpeedMathGameState;
        const currentQ = sgs.questions[sgs.currentQuestion];
        const safeQuestion = sgs.phase === 'question'
          ? { problem: currentQ.problem, options: currentQ.options, difficulty: currentQ.difficulty }
          : { problem: currentQ.problem, options: currentQ.options, difficulty: currentQ.difficulty, correctIndex: currentQ.correctIndex };

        return NextResponse.json({
          gameType: 'speed-math',
          phase: sgs.phase,
          currentQuestion: sgs.currentQuestion,
          totalQuestions: sgs.questions.length,
          question: safeQuestion,
          answers: sgs.phase === 'question' ? Object.keys(sgs.answers) : sgs.answers,
          scores: sgs.scores,
          questionStartedAt: sgs.questionStartedAt,
          players: room.players,
        });
      }

      case 'word-blitz': {
        const wgs = gs as WordBlitzGameState;
        return NextResponse.json({
          gameType: 'word-blitz',
          phase: wgs.phase,
          currentRound: wgs.currentRound,
          totalRounds: wgs.totalRounds,
          letters: wgs.letters,
          roundStartedAt: wgs.roundStartedAt,
          submittedWords: wgs.submittedWords,
          scores: wgs.scores,
          players: room.players,
        });
      }

      case 'quick-draw': {
        const qgs = gs as QuickDrawGameState;
        const requestingPlayerId = new URL(request.url).searchParams.get('pid') || '';
        const currentDrawerId = qgs.drawerOrder[qgs.currentRound];
        const revealWord = qgs.phase !== 'drawing' || requestingPlayerId === currentDrawerId;

        return NextResponse.json({
          gameType: 'quick-draw',
          phase: qgs.phase,
          currentRound: qgs.currentRound,
          totalRounds: qgs.totalRounds,
          currentDrawerId,
          wordPrompt: revealWord ? qgs.wordPrompt : null,
          roundStartedAt: qgs.roundStartedAt,
          canvasData: qgs.canvasData,
          correctGuessers: qgs.correctGuessers,
          scores: qgs.scores,
          players: room.players,
        });
      }

      case 'emoji-battle': {
        const egs = gs as EmojiBattleGameState;
        
        // Auto-advance: playing phase expires after 5 seconds
        if (egs.phase === 'playing' && Date.now() - egs.roundStartedAt > 5000) {
          advanceEmojiBattle(params.code);
        }
        // Auto-advance: results phase lasts 2 seconds
        if (egs.phase === 'results' && Date.now() - egs.roundStartedAt > 7000) {
          advanceEmojiBattle(params.code);
        }
        
        return NextResponse.json({
          gameType: 'emoji-battle',
          phase: egs.phase,
          currentRound: egs.currentRound,
          totalRounds: egs.totalRounds,
          targetEmoji: egs.targetEmoji,
          grid: egs.grid,
          correctIndex: egs.phase !== 'playing' ? egs.correctIndex : undefined,
          answers: egs.phase === 'playing' ? Object.keys(egs.answers).filter(k => egs.answers[k].correct) : egs.answers,
          scores: egs.scores,
          roundStartedAt: egs.roundStartedAt,
          players: room.players,
        });
      }

      default:
        return NextResponse.json({ error: 'Unknown game type' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to get game state' }, { status: 500 });
  }
}
