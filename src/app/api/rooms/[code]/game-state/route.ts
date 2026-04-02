import { NextResponse } from 'next/server';
import { getRoom, advanceEmojiBattle, forceReactionResults, advanceReactionRound, forceColorChaosResults, advanceColorChaosRound, forceCharadesResults } from '@/lib/rooms';
import { TriviaGameState, MemoryMatchGameState, ThisOrThatGameState, SpeedMathGameState, WordBlitzGameState, QuickDrawGameState, EmojiBattleGameState, ReactionSpeedGameState, LieDetectorGameState, ColorChaosGameState, CharadesGameState } from '@/lib/types';

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
        const locale = new URL(request.url).searchParams.get('locale') || 'he';
        const questionPool = locale === 'en' ? tgs.questions_en : tgs.questions_he;
        const currentQ = (questionPool ?? tgs.questions)[tgs.currentQuestion];
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
        const locale = new URL(request.url).searchParams.get('locale') || 'he';
        const roundPool = locale === 'en' ? tgs.rounds_en : tgs.rounds_he;
        const currentRound = (roundPool ?? tgs.rounds)[tgs.currentRound];

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
        
        // Auto-advance: playing phase expires after 7 seconds
        if (egs.phase === 'playing' && Date.now() - egs.roundStartedAt > 7000) {
          advanceEmojiBattle(params.code);
        }
        // Auto-advance: results phase lasts 2 seconds
        if (egs.phase === 'results' && Date.now() - egs.roundStartedAt > 9000) {
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

      case 'reaction-speed': {
        const rgs = gs as ReactionSpeedGameState;
        const now = Date.now();

        // Auto-transition: if waiting phase and greenAt has passed, set phase to 'go'
        if (rgs.phase === 'waiting' && now >= rgs.greenAt) {
          rgs.phase = 'go';
        }

        // Auto-force results after 10 seconds in go phase (timeout for slow players)
        if (rgs.phase === 'go' && now - rgs.greenAt > 10000) {
          forceReactionResults(params.code);
        }

        // Auto-advance from results after 3 seconds
        if (rgs.phase === 'results') {
          const resultsDuration = 3000;
          // Find when results started (approximate: latest reaction or greenAt + 10s)
          const latestReaction = Object.values(rgs.reactions).reduce(
            (max, r) => Math.max(max, r.reactedAt), 0
          );
          const resultsStartedAt = latestReaction > 0 ? latestReaction : rgs.greenAt + 10000;
          if (now - resultsStartedAt > resultsDuration) {
            advanceReactionRound(params.code);
          }
        }

        return NextResponse.json({
          gameType: 'reaction-speed',
          phase: rgs.phase,
          currentRound: rgs.currentRound,
          totalRounds: rgs.totalRounds,
          roundStartedAt: rgs.roundStartedAt,
          greenAt: rgs.greenAt,
          reactions: rgs.phase === 'results' || rgs.phase === 'leaderboard' ? rgs.reactions : 
            // During waiting/go, only reveal if player false-started (so they see their penalty)
            Object.fromEntries(
              Object.entries(rgs.reactions).filter(([, r]) => r.falseStart)
            ),
          scores: rgs.scores,
          players: room.players,
        });
      }

      case 'lie-detector': {
        const lgs = gs as LieDetectorGameState;
        const requestingPid = new URL(request.url).searchParams.get('pid') || '';

        return NextResponse.json({
          gameType: 'lie-detector',
          phase: lgs.phase,
          currentRound: lgs.currentRound,
          totalRounds: lgs.totalRounds,
          currentSpeakerId: lgs.currentSpeakerId,
          prompt: lgs.prompt,
          // Hide statement during statement phase (only speaker sees it via their own input)
          statement: lgs.phase !== 'statement' ? lgs.statement : null,
          // Only reveal speakerTruth during reveal, results, and leaderboard
          speakerTruth: (lgs.phase === 'reveal' || lgs.phase === 'results' || lgs.phase === 'leaderboard') ? lgs.speakerTruth : null,
          // During voting, only show who voted (not what they voted). During reveal+, show full votes.
          votes: lgs.phase === 'voting'
            ? Object.keys(lgs.votes)
            : lgs.votes,
          scores: lgs.scores,
          roundStartedAt: lgs.roundStartedAt,
          players: room.players,
        });
      }

      case 'color-chaos': {
        const cgs = gs as ColorChaosGameState;

        // Auto-advance: playing phase expires after 8 seconds
        if (cgs.phase === 'playing' && Date.now() - cgs.roundStartedAt > 8000) {
          forceColorChaosResults(params.code);
        }
        // Auto-advance: results phase lasts 2.5 seconds
        if (cgs.phase === 'results' && Date.now() - cgs.roundStartedAt > 10500) {
          advanceColorChaosRound(params.code);
        }

        const currentRound = cgs.rounds[cgs.currentRound];
        return NextResponse.json({
          gameType: 'color-chaos',
          phase: cgs.phase,
          currentRound: cgs.currentRound,
          totalRounds: cgs.totalRounds,
          round: {
            wordText: currentRound.wordText,
            inkColor: currentRound.inkColor,
            inkColorName: currentRound.inkColorName,
            options: currentRound.options,
            correctIndex: cgs.phase !== 'playing' ? currentRound.correctIndex : undefined,
          },
          answers: cgs.phase === 'playing' ? Object.keys(cgs.answers) : cgs.answers,
          scores: cgs.scores,
          roundStartedAt: cgs.roundStartedAt,
          players: room.players,
        });
      }

      case 'charades': {
        const cgs = gs as CharadesGameState;
        const requestingPid = new URL(request.url).searchParams.get('pid') || '';
        const isDescriber = requestingPid === cgs.currentDescriberId;

        // Auto-advance: describing phase expires after 45 seconds
        if (cgs.phase === 'describing' && Date.now() - cgs.roundStartedAt > 45000) {
          forceCharadesResults(params.code);
        }

        return NextResponse.json({
          gameType: 'charades',
          phase: cgs.phase,
          currentRound: cgs.currentRound,
          totalRounds: cgs.totalRounds,
          currentDescriberId: cgs.currentDescriberId,
          // Only describer sees the word and forbidden words during describing phase
          currentWord: (isDescriber || cgs.phase !== 'describing')
            ? cgs.currentWord
            : null,
          clues: cgs.clues,
          guesses: cgs.phase === 'describing'
            ? Object.fromEntries(Object.entries(cgs.guesses).map(([k, v]) => [k, { correct: v.correct, guessedAt: v.guessedAt }]))
            : cgs.guesses,
          correctGuessers: cgs.correctGuessers,
          scores: cgs.scores,
          roundStartedAt: cgs.roundStartedAt,
          forbiddenUsed: cgs.forbiddenUsed,
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
