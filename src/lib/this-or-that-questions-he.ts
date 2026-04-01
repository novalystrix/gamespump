export interface ThisOrThatRound {
  question: string;
  optionA: string;
  optionB: string;
  category: string;
}

export const HEBREW_THIS_OR_THAT: ThisOrThatRound[] = [
  // אוכל
  { question: 'פלאפל או שווארמה?', optionA: 'פלאפל', optionB: 'שווארמה', category: 'אוכל' },
  { question: 'חומוס או טחינה?', optionA: 'חומוס', optionB: 'טחינה', category: 'אוכל' },
  { question: 'פיצה או סושי?', optionA: 'פיצה', optionB: 'סושי', category: 'אוכל' },
  { question: 'שוקולד או גלידה?', optionA: 'שוקולד', optionB: 'גלידה', category: 'אוכל' },
  { question: 'סבתא בישלה או מסעדה?', optionA: 'סבתא בישלה', optionB: 'מסעדה', category: 'אוכל' },
  { question: 'בורקס או ג׳חנון?', optionA: 'בורקס', optionB: 'ג׳חנון', category: 'אוכל' },
  { question: 'שקשוקה או חביתה?', optionA: 'שקשוקה', optionB: 'חביתה', category: 'אוכל' },

  // מקומות
  { question: 'תל אביב או ירושלים?', optionA: 'תל אביב', optionB: 'ירושלים', category: 'מקומות' },
  { question: 'חוף או הר?', optionA: 'חוף', optionB: 'הר', category: 'מקומות' },
  { question: 'נסיעה לחו"ל או טיול בארץ?', optionA: 'נסיעה לחו"ל', optionB: 'טיול בארץ', category: 'מקומות' },
  { question: 'אילת או חרמון?', optionA: 'אילת', optionB: 'חרמון', category: 'מקומות' },
  { question: 'ניו יורק או לונדון?', optionA: 'ניו יורק', optionB: 'לונדון', category: 'מקומות' },
  { question: 'כנרת או ים המלח?', optionA: 'כנרת', optionB: 'ים המלח', category: 'מקומות' },

  // תרבות
  { question: 'אריק איינשטיין או שלמה ארצי?', optionA: 'אריק איינשטיין', optionB: 'שלמה ארצי', category: 'תרבות' },
  { question: 'סדרה ישראלית או סדרה אמריקאית?', optionA: 'סדרה ישראלית', optionB: 'סדרה אמריקאית', category: 'תרבות' },
  { question: 'ספוטיפיי או רדיו?', optionA: 'ספוטיפיי', optionB: 'רדיו', category: 'תרבות' },
  { question: 'קונצרט חי או אוזניות בבית?', optionA: 'קונצרט חי', optionB: 'אוזניות בבית', category: 'תרבות' },
  { question: 'פאודה או שטיסל?', optionA: 'פאודה', optionB: 'שטיסל', category: 'תרבות' },
  { question: 'נטפליקס או קולנוע?', optionA: 'נטפליקס', optionB: 'קולנוע', category: 'תרבות' },

  // חיים
  { question: 'בוקר מוקדם או לילה מאוחר?', optionA: 'בוקר מוקדם', optionB: 'לילה מאוחר', category: 'חיים' },
  { question: 'קיץ או חורף?', optionA: 'קיץ', optionB: 'חורף', category: 'חיים' },
  { question: 'חתול או כלב?', optionA: 'חתול', optionB: 'כלב', category: 'חיים' },
  { question: 'עבודה מהבית או עבודה מהמשרד?', optionA: 'מהבית', optionB: 'מהמשרד', category: 'חיים' },
  { question: 'וואטסאפ או שיחת טלפון?', optionA: 'וואטסאפ', optionB: 'שיחת טלפון', category: 'חיים' },
  { question: 'ספר או נטפליקס?', optionA: 'ספר', optionB: 'נטפליקס', category: 'חיים' },
  { question: 'כסף או זמן פנוי?', optionA: 'כסף', optionB: 'זמן פנוי', category: 'חיים' },
  { question: 'לדעת הכל או לשכוח הכל?', optionA: 'לדעת הכל', optionB: 'לשכוח הכל', category: 'חיים' },

  // בידור
  { question: 'כדורגל או כדורסל?', optionA: 'כדורגל', optionB: 'כדורסל', category: 'בידור' },
  { question: 'בובספוג או דרגון בול?', optionA: 'בובספוג', optionB: 'דרגון בול', category: 'בידור' },
  { question: 'טיקטוק או יוטיוב?', optionA: 'טיקטוק', optionB: 'יוטיוב', category: 'בידור' },
  { question: 'מסיבה גדולה או ערב עם חברים קרובים?', optionA: 'מסיבה גדולה', optionB: 'ערב עם חברים', category: 'בידור' },
  { question: 'פלייסטיישן או אקסבוקס?', optionA: 'פלייסטיישן', optionB: 'אקסבוקס', category: 'בידור' },
  { question: 'אינסטגרם או טוויטר?', optionA: 'אינסטגרם', optionB: 'טוויטר', category: 'בידור' },
  { question: 'הארי פוטר או שר הטבעות?', optionA: 'הארי פוטר', optionB: 'שר הטבעות', category: 'בידור' },
  { question: 'מרוול או DC?', optionA: 'מרוול', optionB: 'DC', category: 'בידור' },
];

export function getShuffledHebrewThisOrThat(count: number): ThisOrThatRound[] {
  const shuffled = [...HEBREW_THIS_OR_THAT].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
