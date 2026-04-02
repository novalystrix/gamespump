import { CharadesWord } from './types';
import { CHARADES_WORDS_HE } from './charades-words-he';

export const CHARADES_WORDS: CharadesWord[] = [
  // Objects
  { word: 'Pizza', forbidden: ['food', 'cheese', 'Italian', 'slice'] },
  { word: 'Umbrella', forbidden: ['rain', 'wet', 'cover', 'handle'] },
  { word: 'Telescope', forbidden: ['stars', 'space', 'look', 'lens'] },
  { word: 'Bicycle', forbidden: ['bike', 'wheels', 'pedal', 'ride'] },
  { word: 'Microphone', forbidden: ['sing', 'speak', 'sound', 'mic'] },
  { word: 'Sunglasses', forbidden: ['sun', 'eyes', 'shade', 'dark'] },
  { word: 'Keyboard', forbidden: ['type', 'computer', 'keys', 'laptop'] },
  { word: 'Backpack', forbidden: ['bag', 'carry', 'school', 'strap'] },
  { word: 'Hammock', forbidden: ['relax', 'swing', 'hang', 'tree'] },
  { word: 'Compass', forbidden: ['direction', 'north', 'navigate', 'point'] },
  { word: 'Escalator', forbidden: ['stairs', 'moving', 'up', 'mall'] },
  { word: 'Padlock', forbidden: ['lock', 'key', 'secure', 'metal'] },
  { word: 'Trampoline', forbidden: ['jump', 'bounce', 'spring', 'fun'] },
  { word: 'Chandelier', forbidden: ['light', 'ceiling', 'fancy', 'crystal'] },

  // Actions
  { word: 'Swimming', forbidden: ['water', 'pool', 'swim', 'ocean'] },
  { word: 'Juggling', forbidden: ['throw', 'catch', 'balls', 'circus'] },
  { word: 'Sneezing', forbidden: ['nose', 'cold', 'sneeze', 'sick'] },
  { word: 'Knitting', forbidden: ['wool', 'needle', 'yarn', 'sweater'] },
  { word: 'Surfing', forbidden: ['wave', 'board', 'ocean', 'surf'] },
  { word: 'Yawning', forbidden: ['tired', 'sleep', 'mouth', 'yawn'] },
  { word: 'Whispering', forbidden: ['quiet', 'whisper', 'voice', 'ear'] },
  { word: 'Painting', forbidden: ['brush', 'color', 'art', 'canvas'] },
  { word: 'Climbing', forbidden: ['up', 'climb', 'mountain', 'ladder'] },
  { word: 'Recycling', forbidden: ['trash', 'green', 'recycle', 'waste'] },

  // Concepts
  { word: 'Birthday', forbidden: ['party', 'cake', 'candle', 'age'] },
  { word: 'Gravity', forbidden: ['fall', 'physics', 'force', 'pull'] },
  { word: 'Democracy', forbidden: ['vote', 'government', 'election', 'people'] },
  { word: 'Jealousy', forbidden: ['envy', 'jealous', 'green', 'feeling'] },
  { word: 'Patience', forbidden: ['wait', 'calm', 'slow', 'patient'] },
  { word: 'Nostalgia', forbidden: ['memory', 'past', 'old', 'remember'] },
  { word: 'Sarcasm', forbidden: ['joke', 'tone', 'mean', 'irony'] },
  { word: 'Deadline', forbidden: ['time', 'due', 'late', 'work'] },

  // Animals
  { word: 'Penguin', forbidden: ['bird', 'cold', 'black', 'Antarctica'] },
  { word: 'Flamingo', forbidden: ['pink', 'bird', 'leg', 'stand'] },
  { word: 'Chameleon', forbidden: ['lizard', 'color', 'change', 'green'] },
  { word: 'Porcupine', forbidden: ['spikes', 'animal', 'sharp', 'quills'] },
  { word: 'Kangaroo', forbidden: ['jump', 'pouch', 'Australia', 'baby'] },
  { word: 'Dolphin', forbidden: ['ocean', 'swim', 'smart', 'fish'] },
  { word: 'Octopus', forbidden: ['arms', 'sea', 'tentacles', 'eight'] },
  { word: 'Hedgehog', forbidden: ['spiny', 'small', 'curl', 'animal'] },

  // Pop culture / broad
  { word: 'Superhero', forbidden: ['power', 'cape', 'Marvel', 'DC'] },
  { word: 'Podcast', forbidden: ['listen', 'audio', 'show', 'radio'] },
  { word: 'Selfie', forbidden: ['photo', 'phone', 'picture', 'camera'] },
  { word: 'Influencer', forbidden: ['social', 'media', 'followers', 'post'] },
  { word: 'Streaming', forbidden: ['Netflix', 'watch', 'online', 'show'] },
  { word: 'Meme', forbidden: ['funny', 'internet', 'image', 'viral'] },
  { word: 'Emoji', forbidden: ['face', 'symbol', 'phone', 'icon'] },
  { word: 'Hashtag', forbidden: ['symbol', 'Twitter', 'tag', 'social'] },

  // Food & drink
  { word: 'Sushi', forbidden: ['Japanese', 'fish', 'rice', 'raw'] },
  { word: 'Smoothie', forbidden: ['drink', 'blend', 'fruit', 'healthy'] },
  { word: 'Barbecue', forbidden: ['grill', 'meat', 'fire', 'outdoor'] },
  { word: 'Croissant', forbidden: ['French', 'bread', 'pastry', 'butter'] },
  { word: 'Guacamole', forbidden: ['avocado', 'dip', 'Mexican', 'green'] },
  { word: 'Popcorn', forbidden: ['movie', 'corn', 'snack', 'bag'] },

  // Places / things
  { word: 'Elevator', forbidden: ['up', 'floor', 'building', 'button'] },
  { word: 'Lighthouse', forbidden: ['light', 'sea', 'tower', 'coast'] },
  { word: 'Skyscraper', forbidden: ['tall', 'building', 'city', 'floor'] },
  { word: 'Campfire', forbidden: ['fire', 'camp', 'wood', 'roast'] },
  { word: 'Tornado', forbidden: ['wind', 'storm', 'spin', 'funnel'] },
  { word: 'Avalanche', forbidden: ['snow', 'mountain', 'slide', 'danger'] },
  { word: 'Quicksand', forbidden: ['sand', 'sink', 'trap', 'stuck'] },
  { word: 'Submarine', forbidden: ['water', 'ocean', 'ship', 'deep'] },
  { word: 'Fingerprint', forbidden: ['finger', 'identity', 'unique', 'police'] },
  { word: 'Thunderstorm', forbidden: ['lightning', 'rain', 'thunder', 'cloud'] },
];

export function getShuffledCharadesWords(count: number, locale?: string): CharadesWord[] {
  const pool = locale === 'he' ? CHARADES_WORDS_HE : CHARADES_WORDS;
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
