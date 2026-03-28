import { MathQuestion } from './types';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateWrongAnswers(correct: number, count: number): number[] {
  const wrongs = new Set<number>();
  // Generate close wrong answers
  const offsets = [-3, -2, -1, 1, 2, 3, -5, 5, -10, 10];
  for (const off of shuffle(offsets)) {
    const wrong = correct + off;
    if (wrong !== correct && wrong >= 0) {
      wrongs.add(wrong);
    }
    if (wrongs.size >= count) break;
  }
  // Fill remaining if needed
  while (wrongs.size < count) {
    const wrong = correct + randomInt(-20, 20);
    if (wrong !== correct && wrong >= 0) {
      wrongs.add(wrong);
    }
  }
  return Array.from(wrongs).slice(0, count);
}

function generateEasy(): { problem: string; answer: number } {
  const ops = ['+', '-'];
  const op = ops[randomInt(0, 1)];
  if (op === '+') {
    const a = randomInt(1, 9);
    const b = randomInt(1, 9);
    return { problem: `${a} + ${b}`, answer: a + b };
  } else {
    const a = randomInt(2, 9);
    const b = randomInt(1, a);
    return { problem: `${a} - ${b}`, answer: a - b };
  }
}

function generateMedium(): { problem: string; answer: number } {
  const type = randomInt(0, 2);
  if (type === 0) {
    // Multiplication
    const a = randomInt(2, 9);
    const b = randomInt(2, 9);
    return { problem: `${a} × ${b}`, answer: a * b };
  } else if (type === 1) {
    // Two-digit addition
    const a = randomInt(11, 49);
    const b = randomInt(11, 49);
    return { problem: `${a} + ${b}`, answer: a + b };
  } else {
    // Two-digit subtraction
    const a = randomInt(30, 99);
    const b = randomInt(11, a - 1);
    return { problem: `${a} - ${b}`, answer: a - b };
  }
}

function generateHard(): { problem: string; answer: number } {
  const type = randomInt(0, 2);
  if (type === 0) {
    // Division (clean results)
    const b = randomInt(2, 12);
    const answer = randomInt(3, 15);
    const a = b * answer;
    return { problem: `${a} ÷ ${b}`, answer };
  } else if (type === 1) {
    // Larger multiplication
    const a = randomInt(11, 39);
    const b = randomInt(2, 9);
    return { problem: `${a} × ${b}`, answer: a * b };
  } else {
    // Three-digit subtraction
    const a = randomInt(100, 300);
    const b = randomInt(30, a - 10);
    return { problem: `${a} - ${b}`, answer: a - b };
  }
}

export function generateMathQuestions(count: number): MathQuestion[] {
  const questions: MathQuestion[] = [];
  
  for (let i = 0; i < count; i++) {
    let difficulty: string;
    let gen: () => { problem: string; answer: number };
    
    if (i < 5) {
      difficulty = 'easy';
      gen = generateEasy;
    } else if (i < 10) {
      difficulty = 'medium';
      gen = generateMedium;
    } else {
      difficulty = 'hard';
      gen = generateHard;
    }
    
    const { problem, answer } = gen();
    const wrongs = generateWrongAnswers(answer, 3);
    const allOptions = shuffle([answer, ...wrongs]);
    const correctIndex = allOptions.indexOf(answer);
    
    questions.push({
      problem,
      options: allOptions,
      correctIndex,
      difficulty,
    });
  }
  
  return questions;
}
