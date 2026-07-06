export type Lang = "en" | "he";

export const translations = {
  en: {
    userTitle: "User Dreams",
    myGoals: "My goals",
    thisMonth: "This month",
    dreamStreak: "Dream Streak",
    mostCommonSymbol: "Most Common Symbol",
    averageMood: "Average Mood",
    setting: "Setting",
    darkMood: "Dark mood",
    hebrewMode: "Hebrew",
    connectedAlarm: "Connected alarm",
    notifications: "Notifications",
    saveToLibrary: "Save to library",
    photoBorder: "Photo border",
    latestDreams: "Latest Dreams",
    byType: "By type",
    seeAll: "See all",
    filterAll: "All",
    filterLatest: "Latest",
    filterAnalysis: "Analysis",
    filterType: "Type",
    filterDate: "Date",
    filterEmotion: "Emotion",
    filterFavorite: "Favorite",
    gallery: "Gallery",
    searchPlaceholder: "Search",
    recentDream: "Recent dream",
    moreCollection: "More of your collection",
    noFavorites: "No favorites yet — tap the heart on any dream.",
    comingSoon: "Coming soon",
    dreamsCount: "Dreams",
    dreamTitleSuffix: "dream",
    whatDoesItSay: "What does it say?",
    symbolsInYourDream: "Symbols in your dream",
    theDreamItself: "The dream itself",
    dreamInputPlaceholder: "...Describe your dream",
    recordPrompt: "Tap to record the dream",
    recordingPrompt: "Listening to the dream",
    recordError: "Something went wrong — tap to try again",
    recordOr: "OR",
    recordTypeIt: "Type it",
    readMore: "Read more",
    readLess: "Read less",
    printConfirmTitle: "To print your dream?",
    cancel: "Cancel",
    print: "Print",
    back: "Back",
    share: "Share",
  },
  he: {
    userTitle: "חלומות המשתמש",
    myGoals: "המטרות שלי",
    thisMonth: "החודש",
    dreamStreak: "רצף חלומות",
    mostCommonSymbol: "הסימול הנפוץ ביותר",
    averageMood: "מצב רוח ממוצע",
    setting: "הגדרות",
    darkMood: "מצב כהה",
    hebrewMode: "עברית",
    connectedAlarm: "התראה מקושרת",
    notifications: "התראות",
    saveToLibrary: "שמירה לספרייה",
    photoBorder: "מסגרת לתמונה",
    latestDreams: "חלומות אחרונים",
    byType: "לפי סוג",
    seeAll: "הצג הכול",
    filterAll: "הכול",
    filterLatest: "אחרונים",
    filterAnalysis: "ניתוח",
    filterType: "סוג",
    filterDate: "תאריך",
    filterEmotion: "רגש",
    filterFavorite: "מועדפים",
    gallery: "גלריה",
    searchPlaceholder: "חיפוש",
    recentDream: "חלום אחרון",
    moreCollection: "עוד מהאוסף שלך",
    noFavorites: "עדיין אין מועדפים — לחץ על הלב בכל חלום.",
    comingSoon: "בקרוב",
    dreamsCount: "חלומות",
    dreamTitleSuffix: "חלום",
    whatDoesItSay: "מה זה אומר",
    symbolsInYourDream: "סימבולים חוזרים בחלום",
    theDreamItself: "החלום",
    dreamInputPlaceholder: "תאר את החלום",
    recordPrompt: "מה חלמת היום?\nלחץ כדי להקליט",
    recordingPrompt: "מקליט את החלום",
    recordError: "משהו השתבש — לחץ לנסות שוב",
    recordOr: "או",
    recordTypeIt: "כתבו את החלום",
    readMore: "קרא עוד",
    readLess: "קרא פחות",
    printConfirmTitle: "להדפיס את החלום?",
    cancel: "ביטול",
    print: "הדפס",
    back: "חזור",
    share: "שתף",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

const moodLabels: Record<Lang, Record<string, string>> = {
  en: {
    Fear: "Fear",
    Confused: "Confused",
    Sweet: "Sweet",
    Sad: "Sad",
    Angry: "Angry",
  },
  he: {
    Fear: "פחד",
    Confused: "מבולבל",
    Sweet: "מתוק",
    Sad: "עצוב",
    Angry: "כועס",
  },
};

export function translateMood(mood: string, lang: Lang): string {
  return moodLabels[lang][mood] ?? mood;
}

function localeFor(lang: Lang): string {
  return lang === "he" ? "he-IL" : "en-US";
}

export function langFromText(text: string | undefined, fallback: Lang): Lang {
  return text && /[֐-׿]/.test(text) ? "he" : fallback;
}

export function formatDreamDate(iso: string, lang: Lang): string {
  const date = new Date(iso);
  if (lang === "he") {
    // Return logical "day month" (e.g. "4 יולי").
    // The captionMeta element carries direction:rtl, so bidi renders this visually as "יולי 4" (month first).
    const day   = date.toLocaleDateString("he-IL", { day: "numeric" });
    const month = date.toLocaleDateString("he-IL", { month: "long" });
    return `${day} ${month}`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDreamTime(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleTimeString(localeFor(lang), { hour: "2-digit", minute: "2-digit" });
}
