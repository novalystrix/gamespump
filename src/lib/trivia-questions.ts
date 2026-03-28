import { TriviaQuestion } from './types';

const ALL_QUESTIONS: TriviaQuestion[] = [
  // General Knowledge
  { question: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], correctIndex: 2, category: "General Knowledge" },
  { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctIndex: 3, category: "General Knowledge" },
  { question: "How many days are in a leap year?", options: ["364", "365", "366", "367"], correctIndex: 2, category: "General Knowledge" },
  { question: "What color do you get when you mix red and yellow?", options: ["Green", "Purple", "Orange", "Brown"], correctIndex: 2, category: "General Knowledge" },
  { question: "How many letters are in the English alphabet?", options: ["24", "25", "26", "27"], correctIndex: 2, category: "General Knowledge" },
  { question: "What shape has 8 sides?", options: ["Hexagon", "Pentagon", "Octagon", "Decagon"], correctIndex: 2, category: "General Knowledge" },

  // Science
  { question: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctIndex: 1, category: "Science" },
  { question: "What gas do plants need to make food?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Helium"], correctIndex: 2, category: "Science" },
  { question: "How many bones does an adult human have?", options: ["186", "206", "226", "246"], correctIndex: 1, category: "Science" },
  { question: "What is the closest star to Earth?", options: ["Polaris", "Sirius", "The Sun", "Alpha Centauri"], correctIndex: 2, category: "Science" },
  { question: "What is H2O commonly known as?", options: ["Salt", "Sugar", "Water", "Air"], correctIndex: 2, category: "Science" },
  { question: "Which planet has the most moons?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], correctIndex: 1, category: "Science" },

  // Pop Culture
  { question: "What is the name of Mickey Mouse's dog?", options: ["Goofy", "Pluto", "Max", "Spike"], correctIndex: 1, category: "Pop Culture" },
  { question: "In Finding Nemo, what type of fish is Nemo?", options: ["Goldfish", "Clownfish", "Angelfish", "Swordfish"], correctIndex: 1, category: "Pop Culture" },
  { question: "What color is Shrek?", options: ["Blue", "Red", "Green", "Purple"], correctIndex: 2, category: "Pop Culture" },
  { question: "Who lives in a pineapple under the sea?", options: ["Patrick Star", "SpongeBob", "Squidward", "Sandy Cheeks"], correctIndex: 1, category: "Pop Culture" },
  { question: "What is the name of the snowman in Frozen?", options: ["Sven", "Kristoff", "Olaf", "Hans"], correctIndex: 2, category: "Pop Culture" },
  { question: "In Mario games, what is Mario's brother called?", options: ["Wario", "Luigi", "Toad", "Bowser"], correctIndex: 1, category: "Pop Culture" },

  // Geography
  { question: "What is the smallest country in the world?", options: ["Monaco", "Vatican City", "Malta", "Liechtenstein"], correctIndex: 1, category: "Geography" },
  { question: "Which country has the most people?", options: ["USA", "India", "China", "Indonesia"], correctIndex: 1, category: "Geography" },
  { question: "What is the longest river in the world?", options: ["Amazon", "Mississippi", "Nile", "Yangtze"], correctIndex: 2, category: "Geography" },
  { question: "On which continent is the Sahara Desert?", options: ["Asia", "Africa", "Australia", "South America"], correctIndex: 1, category: "Geography" },
  { question: "What country is shaped like a boot?", options: ["Spain", "Greece", "Italy", "Portugal"], correctIndex: 2, category: "Geography" },
  { question: "What is the capital of Japan?", options: ["Osaka", "Kyoto", "Yokohama", "Tokyo"], correctIndex: 3, category: "Geography" },

  // Animals
  { question: "What is the fastest land animal?", options: ["Lion", "Cheetah", "Horse", "Gazelle"], correctIndex: 1, category: "Animals" },
  { question: "How many legs does an octopus have?", options: ["6", "8", "10", "12"], correctIndex: 1, category: "Animals" },
  { question: "What animal is known for its black and white stripes?", options: ["Tiger", "Panda", "Zebra", "Skunk"], correctIndex: 2, category: "Animals" },
  { question: "Which bird is the largest in the world?", options: ["Eagle", "Ostrich", "Penguin", "Albatross"], correctIndex: 1, category: "Animals" },
  { question: "What do caterpillars turn into?", options: ["Moths only", "Butterflies or moths", "Beetles", "Dragonflies"], correctIndex: 1, category: "Animals" },
  { question: "What is a group of wolves called?", options: ["Flock", "Herd", "Pack", "School"], correctIndex: 2, category: "Animals" },

  // Food
  { question: "What fruit is used to make guacamole?", options: ["Tomato", "Avocado", "Lime", "Mango"], correctIndex: 1, category: "Food" },
  { question: "What is the main ingredient in hummus?", options: ["Lentils", "Chickpeas", "Peanuts", "Kidney beans"], correctIndex: 1, category: "Food" },
  { question: "Which country is pizza originally from?", options: ["France", "Spain", "Italy", "Greece"], correctIndex: 2, category: "Food" },
  { question: "What gives bread its holes?", options: ["Baking soda", "Yeast", "Butter", "Salt"], correctIndex: 1, category: "Food" },
  { question: "What is sushi traditionally wrapped in?", options: ["Rice paper", "Seaweed", "Lettuce", "Banana leaf"], correctIndex: 1, category: "Food" },
  { question: "What spice is made from dried crocus flowers?", options: ["Turmeric", "Paprika", "Saffron", "Cinnamon"], correctIndex: 2, category: "Food" },
];

export function getShuffledQuestions(count: number = 10): TriviaQuestion[] {
  const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
