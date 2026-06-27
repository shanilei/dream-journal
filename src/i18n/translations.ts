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
    latestDreams: "Latest Dreams",
    byType: "By type",
    seeAll: "See all",
    dreamsCount: "Dreams",
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
    latestDreams: "חלומות אחרונים",
    byType: "לפי סוג",
    seeAll: "הצג הכול",
    dreamsCount: "חלומות",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
