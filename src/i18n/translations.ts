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
    dreamsCount: "Dreams",
    dreamTitleSuffix: "dream",
    whatDoesItSay: "What does it say?",
    symbolsInYourDream: "Symbols in your dream",
    theDreamItself: "The dream itself",
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
    dreamsCount: "חלומות",
    dreamTitleSuffix: "חלום",
    whatDoesItSay: "מה זה אומר?",
    symbolsInYourDream: "סימבולים בחלום שלך",
    theDreamItself: "החלום עצמו",
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
  },
  he: {
    Fear: "פחד",
    Confused: "מבולבל",
    Sweet: "מתוק",
  },
};

export function translateMood(mood: string, lang: Lang): string {
  return moodLabels[lang][mood] ?? mood;
}

function localeFor(lang: Lang): string {
  return lang === "he" ? "he-IL" : "en-US";
}

export function formatDreamDate(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleDateString(localeFor(lang), { month: "short", day: "numeric" });
}

export function formatDreamTime(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleTimeString(localeFor(lang), { hour: "2-digit", minute: "2-digit" });
}
