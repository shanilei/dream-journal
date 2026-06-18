# Dream Journal — שלב 1: pipeline הניתוח

קוד התחלה אמיתי לשלב הראשון של המערכת: מקבל טקסט של חלום ומחזיר ניתוח מובנה
(רגשות, דמויות, מקומות, סמלים, תמות) כ-JSON, דרך ה-Anthropic API.

בלי UI, בלי בסיס נתונים, בלי תמונות — בכוונה. קודם מוודאים שהליבה עובדת.

## דרישות מקדימות
- Node.js 18 ומעלה
- מפתח API מ-https://console.anthropic.com (נפרד מהמנוי של Claude Code)

## התקנה
```bash
cd dream-journal

# התקנת התלויות
npm install @anthropic-ai/sdk dotenv
npm install -D typescript tsx @types/node

# הגדרת המפתח
cp .env.example .env
# פתח את .env ושים את המפתח האמיתי שלך
```

## הרצה
```bash
# ניתוח חלום ישירות מהשורה
npm run analyze -- "חלמתי שאני עף מעל הים"

# או מתוך קובץ (יש כאן דוגמה מוכנה)
npm run analyze -- --file dream.txt
```
הפלט הוא JSON מובנה. הרץ על כמה חלומות אמיתיים ובדוק שהתוצאה עקבית ובאיכות שאתה אוהב.

## איפה לכוונן
- `src/analyze.ts` → `FRAMEWORK_SYSTEM_PROMPT` — המסגרת הפרשנית. זה ה-DNA של המוצר; ערוך כאן את הטון, העדשה והכללים.
- `src/analyze.ts` → `analysisTool.input_schema` — מה בדיוק מחולץ מכל חלום.

## להמשיך עם Claude Code
פתח את התיקייה הזו בטרמינל, הרץ `claude`, ותעביר לו את הפרומפט הבא כשהשלב הזה עובד לשביעות רצונך:

```text
קרא את CLAUDE.md ואת src/analyze.ts. שלב 1 (ניתוח) עובד.
עכשיו נעבור לשלב 2: הוסף פונקציה interpretDream שמקבלת את ה-DreamAnalysis
ומחזירה פרשנות כתובה קצרה (3-4 משפטים), insights רגשיים, ורשימת keywords.
נסח כהזמנה לרפלקציה, לא כאבחנה. אל תיגע עדיין ב-DB, UI או תמונות.
```
