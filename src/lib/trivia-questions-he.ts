export interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
}

const HEBREW_TRIVIA: TriviaQuestion[] = [
  // גיאוגרפיה
  {
    question: 'מהי עיר הבירה של ישראל?',
    options: ['ירושלים', 'תל אביב', 'חיפה', 'באר שבע'],
    correctIndex: 0,
    category: 'גיאוגרפיה',
  },
  {
    question: 'מהו ההר הגבוה ביותר בישראל?',
    options: ['הר תבור', 'הר מירון', 'הר החרמון', 'הר הכרמל'],
    correctIndex: 2,
    category: 'גיאוגרפיה',
  },
  {
    question: 'איזה ים נמצא בנקודה הנמוכה ביותר על פני כדור הארץ?',
    options: ['ים סוף', 'ים התיכון', 'הכנרת', 'ים המלח'],
    correctIndex: 3,
    category: 'גיאוגרפיה',
  },
  {
    question: 'כמה מחוזות יש בישראל?',
    options: ['4', '6', '7', '8'],
    correctIndex: 1,
    category: 'גיאוגרפיה',
  },
  {
    question: 'איזו עיר מכונה "העיר שלא נעצרת"?',
    options: ['ירושלים', 'חיפה', 'תל אביב', 'אילת'],
    correctIndex: 2,
    category: 'גיאוגרפיה',
  },
  {
    question: 'באיזה מדבר נמצאת מצפה רמון?',
    options: ['מדבר יהודה', 'מדבר הנגב', 'ערבה', 'מדבר סיני'],
    correctIndex: 1,
    category: 'גיאוגרפיה',
  },
  {
    question: 'מהי המדינה הכי קטנה בעולם?',
    options: ['מונקו', 'ותיקן', 'סן מרינו', 'ליכטנשטיין'],
    correctIndex: 1,
    category: 'גיאוגרפיה',
  },
  {
    question: 'איזה נהר הוא הארוך בעולם?',
    options: ['אמזונס', 'נילוס', 'מיסיסיפי', 'ינגצה'],
    correctIndex: 1,
    category: 'גיאוגרפיה',
  },

  // היסטוריה
  {
    question: 'באיזו שנה הוקמה מדינת ישראל?',
    options: ['1945', '1948', '1950', '1952'],
    correctIndex: 1,
    category: 'היסטוריה',
  },
  {
    question: 'מי הכריז על הקמת מדינת ישראל?',
    options: ['חיים וייצמן', 'דוד בן גוריון', 'זאב ז׳בוטינסקי', 'גולדה מאיר'],
    correctIndex: 1,
    category: 'היסטוריה',
  },
  {
    question: 'באיזו שנה התקיימה מלחמת ששת הימים?',
    options: ['1956', '1967', '1973', '1982'],
    correctIndex: 1,
    category: 'היסטוריה',
  },
  {
    question: 'מי הייתה ראשת הממשלה הראשונה של ישראל?',
    options: ['גולדה מאיר', 'דליה איציק', 'ציפי לבני', 'שולמית אלוני'],
    correctIndex: 0,
    category: 'היסטוריה',
  },
  {
    question: 'באיזו שנה נחתמו הסכמי אוסלו?',
    options: ['1991', '1993', '1995', '1997'],
    correctIndex: 1,
    category: 'היסטוריה',
  },
  {
    question: 'מי בנה את החומה השנייה של בית המקדש?',
    options: ['שלמה המלך', 'הורדוס', 'נחמיה', 'דוד המלך'],
    correctIndex: 1,
    category: 'היסטוריה',
  },
  {
    question: 'באיזו שנה הגיע אדם לירח לראשונה?',
    options: ['1965', '1967', '1969', '1971'],
    correctIndex: 2,
    category: 'היסטוריה',
  },
  {
    question: 'מי היה נשיא ישראל הראשון?',
    options: ['דוד בן גוריון', 'חיים וייצמן', 'יצחק בן צבי', 'זלמן שזר'],
    correctIndex: 1,
    category: 'היסטוריה',
  },

  // תרבות
  {
    question: 'מי שר את "עיניים שלי"?',
    options: ['עידן רייכל', 'שלמה ארצי', 'אייל גולן', 'עומר אדם'],
    correctIndex: 3,
    category: 'תרבות',
  },
  {
    question: 'איזו להקה שרה את "יש בי אהבה"?',
    options: ['כוורת', 'משינה', 'אתניקס', 'טיפקס'],
    correctIndex: 0,
    category: 'תרבות',
  },
  {
    question: 'מי ניצחה באירוויזיון 2018 עם "Toy"?',
    options: ['דנה אינטרנשיונל', 'נטע ברזילי', 'עדן אלנה', 'שירי מימון'],
    correctIndex: 1,
    category: 'תרבות',
  },
  {
    question: 'מי ביים את הסרט "ללכת על המים"?',
    options: ['איתן פוקס', 'אבי נשר', 'ערן ריקליס', 'שמעון דותן'],
    correctIndex: 0,
    category: 'תרבות',
  },
  {
    question: 'באיזו סדרה מככבים נבו קמחי ורותם סלע?',
    options: ['פאודה', 'שטיסל', 'עבודה ערבית', 'בית הספר'],
    correctIndex: 2,
    category: 'תרבות',
  },
  {
    question: 'מי כתב את השיר "ירושלים של זהב"?',
    options: ['נעמי שמר', 'חיים גורי', 'רחל', 'לאה גולדברג'],
    correctIndex: 0,
    category: 'תרבות',
  },
  {
    question: 'איזה סרט ישראלי היה מועמד לאוסקר ב-2009?',
    options: ['ואלס עם באשיר', 'ביקור התזמורת', 'לבנון', 'בופור'],
    correctIndex: 0,
    category: 'תרבות',
  },
  {
    question: 'מי שר את "בא לי"?',
    options: ['סטטיק ובן אל', 'עידן רייכל', 'אייל גולן', 'נועה קירל'],
    correctIndex: 0,
    category: 'תרבות',
  },

  // מדע
  {
    question: 'מהו היסוד הכימי הנפוץ ביותר ביקום?',
    options: ['חמצן', 'פחמן', 'מימן', 'הליום'],
    correctIndex: 2,
    category: 'מדע',
  },
  {
    question: 'כמה כוכבי לכת יש במערכת השמש?',
    options: ['7', '8', '9', '10'],
    correctIndex: 1,
    category: 'מדע',
  },
  {
    question: 'מהי יחידת המידה של כוח?',
    options: ['ג׳אול', 'ניוטון', 'וואט', 'אמפר'],
    correctIndex: 1,
    category: 'מדע',
  },
  {
    question: 'איזה גז מהווה את רוב האטמוספרה של כדור הארץ?',
    options: ['חמצן', 'חנקן', 'פחמן דו-חמצני', 'ארגון'],
    correctIndex: 1,
    category: 'מדע',
  },
  {
    question: 'מהי מהירות האור בקירוב?',
    options: ['100,000 קמ"ש', '300,000 קמ"ש', '300,000 ק"מ לשנייה', '100,000 ק"מ לשנייה'],
    correctIndex: 2,
    category: 'מדע',
  },
  {
    question: 'מי המציא את החשמל?',
    options: ['תומאס אדיסון', 'ניקולה טסלה', 'אלכסנדר גרהם בל', 'אף אחד - גילוי טבעי'],
    correctIndex: 3,
    category: 'מדע',
  },
  {
    question: 'מהו האיבר הגדול ביותר בגוף האדם?',
    options: ['הכבד', 'המוח', 'העור', 'הריאות'],
    correctIndex: 2,
    category: 'מדע',
  },
  {
    question: 'כמה עצמות יש בגוף האדם הבוגר?',
    options: ['186', '206', '226', '256'],
    correctIndex: 1,
    category: 'מדע',
  },

  // ספורט
  {
    question: 'מי הוא שחקן הכדורגל הישראלי שכיכב בפרמיירליג?',
    options: ['יוסי בניון', 'ערן זהבי', 'תאל בן חיים', 'דוראן קלואז'],
    correctIndex: 2,
    category: 'ספורט',
  },
  {
    question: 'כמה שחקנים יש בקבוצת כדורסל על המגרש?',
    options: ['4', '5', '6', '7'],
    correctIndex: 1,
    category: 'ספורט',
  },
  {
    question: 'מכבי תל אביב זכתה באליפות אירופה בכדורסל כמה פעמים?',
    options: ['4', '6', '8', '10'],
    correctIndex: 1,
    category: 'ספורט',
  },
  {
    question: 'באיזה ענף ספורט זכתה ירדן ג׳רבי במדליית אולימפית?',
    options: ['שחייה', 'ג׳ודו', 'התעמלות', 'אתלטיקה'],
    correctIndex: 1,
    category: 'ספורט',
  },
  {
    question: 'מהו הענף הפופולרי ביותר בישראל?',
    options: ['כדורסל', 'כדורגל', 'טניס', 'שחייה'],
    correctIndex: 1,
    category: 'ספורט',
  },
  {
    question: 'כמה זמן נמשך משחק כדורגל רגיל?',
    options: ['60 דקות', '80 דקות', '90 דקות', '120 דקות'],
    correctIndex: 2,
    category: 'ספורט',
  },
  {
    question: 'באיזו עיר התקיימו המשחקים האולימפיים ב-2024?',
    options: ['טוקיו', 'פריז', 'לוס אנג׳לס', 'לונדון'],
    correctIndex: 1,
    category: 'ספורט',
  },

  // אוכל
  {
    question: 'מהו המרכיב העיקרי בפלאפל?',
    options: ['עדשים', 'חומוס', 'פול', 'סויה'],
    correctIndex: 1,
    category: 'אוכל',
  },
  {
    question: 'מהו המאכל הלאומי של ישראל (לא רשמי)?',
    options: ['שווארמה', 'פלאפל', 'חומוס', 'שקשוקה'],
    correctIndex: 1,
    category: 'אוכל',
  },
  {
    question: 'מהי הצמח שממנו מכינים טחינה?',
    options: ['חמניות', 'שומשום', 'בוטנים', 'שקדים'],
    correctIndex: 1,
    category: 'אוכל',
  },
  {
    question: 'מהו סוג הגבינה המשמש לעוגת גבינה ישראלית מסורתית?',
    options: ['שמנת', 'גבינה לבנה', 'קוטג׳', 'ריקוטה'],
    correctIndex: 1,
    category: 'אוכל',
  },
  {
    question: 'מה שמים בסביח מלבד חציל?',
    options: ['שניצל', 'ביצה קשה', 'טונה', 'בשר טחון'],
    correctIndex: 1,
    category: 'אוכל',
  },
  {
    question: 'מאיזו מדינה מגיע הג׳חנון?',
    options: ['מרוקו', 'עיראק', 'תימן', 'לוב'],
    correctIndex: 2,
    category: 'אוכל',
  },
  {
    question: 'איזה תבלין נותן לקארי את הצבע הצהוב?',
    options: ['פפריקה', 'כורכום', 'כמון', 'זעפרן'],
    correctIndex: 1,
    category: 'אוכל',
  },

  // כללי
  {
    question: 'מהו הצבע שנוצר מערבוב אדום וכחול?',
    options: ['ירוק', 'כתום', 'סגול', 'חום'],
    correctIndex: 2,
    category: 'כללי',
  },
  {
    question: 'כמה ימים יש בשנה מעוברת?',
    options: ['364', '365', '366', '367'],
    correctIndex: 2,
    category: 'כללי',
  },
  {
    question: 'מהו סימן המזל הראשון בגלגל המזלות?',
    options: ['שור', 'טלה', 'תאומים', 'סרטן'],
    correctIndex: 1,
    category: 'כללי',
  },
  {
    question: 'כמה אותיות יש באלפבית העברי?',
    options: ['20', '22', '24', '26'],
    correctIndex: 1,
    category: 'כללי',
  },
  {
    question: 'מהו המטבע הרשמי של ישראל?',
    options: ['דולר', 'לירה', 'שקל חדש', 'אירו'],
    correctIndex: 2,
    category: 'כללי',
  },
  {
    question: 'באיזו שפה כתובה התורה?',
    options: ['ארמית', 'עברית', 'יוונית', 'לטינית'],
    correctIndex: 1,
    category: 'כללי',
  },
  {
    question: 'מי צייר את המונה ליזה?',
    options: ['פיקאסו', 'מיכלאנג׳לו', 'לאונרדו דה וינצ׳י', 'רמברנדט'],
    correctIndex: 2,
    category: 'כללי',
  },
  {
    question: 'מהו כוכב הלכת הגדול ביותר במערכת השמש?',
    options: ['שבתאי', 'צדק', 'אורנוס', 'נפטון'],
    correctIndex: 1,
    category: 'כללי',
  },
];

export function getShuffledHebrewQuestions(count: number): TriviaQuestion[] {
  const shuffled = [...HEBREW_TRIVIA].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
