# Dream Journal — יומן חלומות מבוסס AI

## מה זה
מערכת שמקבלת חלום (קול או טקסט), מנתחת אותו, ומפיקה פרשנות כתובה ותמונה מעוצבת.
החלום נשמר ביומן אישי, והמערכת מזהה דפוסים חוזרים לאורך זמן.

## ארכיטקטורה
Pipeline בן שלבים: input → speech-to-text → analysis → interpretation → image → storage → patterns.
כל שלב נבדק בנפרד לפני המעבר לבא.

## סטאק
TypeScript, Next.js, Supabase (Postgres + auth + storage + pgvector), Anthropic API לניתוח ופרשנות.
(בשלב 1 הנוכחי יש רק סקריפט TypeScript בודד — בלי Next.js או Supabase עדיין.)

## תוכנית בנייה (לפי הסדר — אל תקפוץ קדימה)
1. ניתוח טקסט בלבד → JSON מובנה   ← **השלב הנוכחי, כבר קיים ב-src/analyze.ts**
2. פרשנות כתובה + keywords
3. יצירת תמונה לפי סגנון מוגדר
4. שמירה + תצוגת יומן
5. קלט קולי (speech-to-text)
6. משתמשים + auth
7. מנוע דפוסים ופרופיל רגשי

## כללי ברזל
- שלב הניתוח חייב להחזיר JSON לפי סכימה קבועה (structured output), לא טקסט חופשי.
- symbols ו-emotions נשמרים כישויות מנורמלות, כדי לזהות חזרתיות בהמשך.
- חלומות = מידע רגיש: הצפנה ב-rest, מינימום חשיפה, מדיניות מחיקה ברורה.
- פרשנות מנוסחת כהזמנה לרפלקציה, לא כאבחנה.
- אל תבנה הכול בבת אחת. שלב אחד עובד ונבדק — ואז ממשיכים.

## איפה עורכים מה
- `src/analyze.ts` → `FRAMEWORK_SYSTEM_PROMPT` = המסגרת הפרשנית (ה-DNA של המוצר).
- `src/analyze.ts` → `analysisTool.input_schema` = הסכימה של מה שמחולץ מכל חלום.

## מערכת עיצוב — כרטיסים ("flat glass")
כל כרטיס/קונטיינר חדש ב-UI (לא רק onboarding) חייב לעקוב אחרי הריצפה
הקיימת של האפליקציה, כפי שנצפתה ב-`GalleryNavBar`'s pill וב-
`DreamResultScreen`'s icon buttons/chips:
- `background: rgba(255,255,255,0.05–0.06)` — לא gradient, לא צבע מלא.
- `border: 1px solid rgba(255,255,255,0.1–0.12)` — קו דק, לא צבעוני ולא עבה.
- `backdrop-filter: blur(20px)`.
- צל רך בלבד (`0 8px 20–32px rgba(0,0,0,0.2–0.25)`) — בלי glow halos מאחורי אייקונים/כרטיסים.
- צבע (accent) נכנס **רק** דרך פרט קטן (אייקון בודד, progress bar) —
  לעולם לא כצביעה של כרטיס שלם או gradient על פני כל הרקע.
זו הייתה תגובה מפורשת של המשתמש אחרי ניסיון גלאסמורפיזם כבד יותר במסך
"Your Journey" — הכיוון הנכון הוא "Apple Health meets a dreamy journal",
לא gaming dashboard.

## מערכת אנימציה/מעברים
- קרוב-נגיעה (easing) סטנדרטי למעברים "חלומיים": `cubic-bezier(0.22, 1, 0.36, 1)`.
- טקסט חדש שנכנס למסך: `opacity: 0, y: 16px → opacity: 1, y: 0`.
- מעברים בין מסכים (onboarding וכל flow עתידי דומה) חייבים רקע רציף אחד
  (glow/starfield) שלא נטען מחדש בין מסכים — לא hard cut. הרכיב הרקעי
  (`OnboardingBackground`) נטען פעם אחת מעל כל ה-flow, לא לכל מסך בנפרד.
- כוריאוגרפיה שכבתית בין מסכים: קודם ה-title היוצא נעלם, אחר כך ה-visual
  זז/דוהה, ואז התוכן הבא נכנס. ריכוז ה-variants המשותפים ב-
  `src/components/onboarding/motion.ts` — לא ערכים אד-הוק לכל מסך.
- **כלל ברזל לגבי `mix-blend-mode`**: אלמנט עם `mix-blend-mode` (למשל
  ה-orb) לעולם לא יכול לשבת מתחת ל-ancestor עם `transform` פעיל (אפילו
  ערך זהה, למשל `scale(1)`) — כל transform יוצר stacking context חדש
  שלוכד את ה-blend מ-לפני שהוא מגיע לרקע האמיתי. אם צריך אנימציית כניסה
  לאלמנט כזה — אפשר להזיז רק `opacity`, לא `y`/`scale`.
- glow blobs שרצים על loop אינסופי עם `animation-delay` שלילי (לצורך
  desync בין כמה גופים) חייבים להיכנס עם `opacity: 0 → 1` (fade-in),
  לא להופיע מיד ב-opacity מלא — אחרת הם כבר יהיו לא-ממורכזים ברגע
  שמשהו אחר (למשל ה-orb) מתחיל לגדול מ-0, ונוצרת אשליה של "גדילה מהצד".
