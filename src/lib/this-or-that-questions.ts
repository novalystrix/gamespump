import { ThisOrThatRound } from './types';

const ALL_QUESTIONS: ThisOrThatRound[] = [
  // Food
  { question: 'Which do you prefer?', optionA: 'Pizza', optionB: 'Tacos', category: 'Food' },
  { question: 'Which is better?', optionA: 'Chocolate', optionB: 'Vanilla', category: 'Food' },
  { question: 'For breakfast?', optionA: 'Pancakes', optionB: 'Waffles', category: 'Food' },
  { question: 'Pick one forever:', optionA: 'Sweet snacks', optionB: 'Salty snacks', category: 'Food' },
  { question: 'Your go-to drink?', optionA: 'Coffee', optionB: 'Tea', category: 'Food' },
  { question: 'Friday night dinner?', optionA: 'Burgers', optionB: 'Sushi', category: 'Food' },
  { question: 'Dessert pick?', optionA: 'Ice cream', optionB: 'Cake', category: 'Food' },

  // Life
  { question: 'You are a...', optionA: 'Morning person', optionB: 'Night owl', category: 'Life' },
  { question: 'Vacation style?', optionA: 'Beach', optionB: 'Mountains', category: 'Life' },
  { question: 'How do you recharge?', optionA: 'Party with friends', optionB: 'Quiet night in', category: 'Life' },
  { question: 'Dream home?', optionA: 'City apartment', optionB: 'Country house', category: 'Life' },
  { question: 'Travel style?', optionA: 'Plan everything', optionB: 'Wing it', category: 'Life' },
  { question: 'Your vibe?', optionA: 'Summer', optionB: 'Winter', category: 'Life' },
  { question: 'Weather preference?', optionA: 'Rainy day', optionB: 'Sunny day', category: 'Life' },

  // Fun
  { question: 'Superpower?', optionA: 'Flying', optionB: 'Invisibility', category: 'Fun' },
  { question: 'Time travel to...', optionA: 'The past', optionB: 'The future', category: 'Fun' },
  { question: 'Would you rather...', optionA: 'Read minds', optionB: 'Be super strong', category: 'Fun' },
  { question: 'In a movie, you are the...', optionA: 'Hero', optionB: 'Villain', category: 'Fun' },
  { question: 'Pick a skill:', optionA: 'Play any instrument', optionB: 'Speak every language', category: 'Fun' },
  { question: 'Dream vehicle?', optionA: 'Sports car', optionB: 'Private jet', category: 'Fun' },
  { question: 'Would you rather...', optionA: 'Live underwater', optionB: 'Live in space', category: 'Fun' },

  // Entertainment
  { question: 'Movie night?', optionA: 'Comedy', optionB: 'Action', category: 'Entertainment' },
  { question: 'Music vibe?', optionA: 'Pop', optionB: 'Rock', category: 'Entertainment' },
  { question: 'Gaming style?', optionA: 'Solo adventure', optionB: 'Multiplayer', category: 'Entertainment' },
  { question: 'Content pick?', optionA: 'Movies', optionB: 'TV series', category: 'Entertainment' },
  { question: 'Reading preference?', optionA: 'Fiction', optionB: 'Non-fiction', category: 'Entertainment' },

  // Hypotheticals
  { question: 'You can only eat one food forever:', optionA: 'Pasta', optionB: 'Rice', category: 'Hypothetical' },
  { question: 'Would you rather have...', optionA: 'No phone for a week', optionB: 'No sleep for 2 days', category: 'Hypothetical' },
  { question: 'For your birthday:', optionA: 'Big surprise party', optionB: 'Small dinner with close friends', category: 'Hypothetical' },
  { question: 'If you could master one:', optionA: 'Cooking', optionB: 'Dancing', category: 'Hypothetical' },
  { question: 'Zombie apocalypse weapon:', optionA: 'Sword', optionB: 'Bow and arrow', category: 'Hypothetical' },
  { question: 'You discover a new planet:', optionA: 'Explore it', optionB: 'Name it after yourself', category: 'Hypothetical' },
  { question: 'Would you rather...', optionA: 'Always be 10 min early', optionB: 'Always be 10 min late', category: 'Hypothetical' },

  // Animals
  { question: 'Pet preference?', optionA: 'Dog', optionB: 'Cat', category: 'Animals' },
  { question: 'Which would you ride?', optionA: 'Dragon', optionB: 'Giant eagle', category: 'Animals' },
  { question: 'Be an animal for a day:', optionA: 'Dolphin', optionB: 'Eagle', category: 'Animals' },
];

export function getShuffledThisOrThatQuestions(count: number): ThisOrThatRound[] {
  const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
