# SESSION LOG — Lucid

לוג עבודה יומי. מתעדכן בסוף כל יום עבודה.
הכי חדש — למעלה.

---

## 2026-07-07

**מה עשינו:**
- **PROJECT_CONTEXT.md** — נוצר קובץ handoff מרכזי: סטאק, routes, pipeline, החלטות עיצוב, טבלת features, כללי ברזל
- **SESSION.md** — נוצר קובץ לוג עבודה יומי (הקובץ הזה)
- *(המשך מסשן קודם)* **תיקון ריבוע ה-orb** — כל ה-CSS edits הושלמו:
- **Record screen redesign** — מסך ההקלטה עוצב מחדש כ-cinematic immersive: רקע כחול-כהה עם gradient פועם, starfield, glow blobs, ה-orb GIF ממוקם במרכז
- **ניסוי + revert Framer Motion** — נוסתה עטיפת Framer Motion לאנימציות ה-orb; גרמה לבעיה במיקום (덮ה את `translateX(-50%)`) — הוחזר לאחור
- **תיקון ריבוע סביב ה-orb** — הבעיה: `mix-blend-mode: screen` לא עובד כשהאלמנט מקודם ל-GPU compositor layer. הפתרון:
  - מיקום button עם `left: calc(50% - 130px)` במקום `transform: translateX(-50%)`
  - אנימציות `recordIn` ו-`breathe` משתמשות ב-`scale` כ-individual CSS property (לא `transform: scale()`)
- **עברית — Your Journey + Settings** — תרגום מלא של YourJourneyScreen ו-SettingsSheet כולל dropdown, Ploni font
- **מערכת אנימציות** — screen transitions (screenIn), gallery animations

**קבצים ששונו:**
- `src/app/record/record.module.css` — ריבוע ה-orb + redesign
- `src/app/record/page.tsx` — הסרת captured state, הסרת live transcript
- `src/components/YourJourneyScreen.tsx` + `.module.css`
- `src/components/SettingsSheet.tsx`
- `src/app/globals.css` — screen transitions

**החלטות שהתקבלו:**
- ה-orb button חייב להיות ללא `transform` על האלמנט עצמו — `left: calc(50% - 130px)` קבוע
- אחרי עצירת הקלטה: עובר ישר ל-loading, אין מסך "captured" ביניים
- אין live transcript בזמן הקלטה — רק ה-orb פועם

---

## 2026-07-06

**מה עשינו:**
- **Search, share, transitions, nav animations** — חיפוש בגלריה, share button, אנימציות ניווט
- **Tap highlight rectangle** — הסרת ה-rectangle הגלובלי ב-mobile tap
- **שמות חלומות מ-AI** — הוספת שם קצר (≤3 מילים) לכל חלום — Claude מחולל, נשמר בDB, מוצג ב-cards ובדף פרטים
- **Favorites / לב** — אייקון לב שמציין חלום מועדף, עובד ב-Hebrew RTL
- **Hebrew DreamResult** — right-align מלא, meta pills, symbol chips, caption time
- **Ploni font** — החלפת David Libre ב-Ploni AAA (local font)
- **Print fix** — תיקון הדפסה ב-iOS Safari (fetch as data URL, new window)
- **Calendar** — חודש נוכחי למעלה, 6 חודשים אחורה לדמו, תאריך על cells
- **Loading screen** — right-align הודעות בעברית
- **Gallery filter order** — All → Date → Type → Emotion → Favorite
- **Glass cards** — שיפור glass effect בגלריה

**קבצים ששונו:**
- `src/components/DreamResultScreen.tsx` + `.module.css`
- `src/components/DreamsByTypeScreen.tsx` + `.module.css`
- `src/components/GalleryNavBar.tsx` + `.module.css` ← **קבצים חדשים**
- `src/components/Icons.tsx`
- `src/app/design-tokens.css`
- `src/app/home.module.css`
- `src/generate-image.ts`
- `src/styles/surreal-minimalist.ts`

**החלטות שהתקבלו:**
- שמות חלומות: Claude מחולל, שדה `name` בDB, מוצג אם קיים (fallback ל-timestamp)
- Ploni AAA הוא ה-Hebrew font הרשמי — David Libre לא בשימוש
- גלריה: default tab = "All"

---

## 2026-07-02

**מה עשינו:**
- **Design system** — design-tokens.css נוצר, צבעים ו-variables מ-Figma
- **Orb GIF** — החלפת אנימציית CSS ב-GIF אמיתי (`/public/images/orb-anim.gif`)
- **Nav glass** — BottomNav עם glass effect
- **Onboarding rebuild** — OnboardingScreen בנוי מחדש

---

## 2026-07-01

**מה עשינו:**
- **3D orb recorder** — אנימציית orb כ-sphere תלת-מימדית
- **Glass nav** — ניווט עם backdrop-filter blur
- **Print fix** — תיקון illustration print

---

## 2026-06-29

**מה עשינו:**
- **פרשנות כתובה** — הוספת `src/interpret.ts` עם Claude (שלב 2 ב-pipeline)
- **Motion blur** — post-processing deterministic motion blur (Gaussian-tapered kernel)
- **Voice recording** — חיבור הקלטה קולית ל-transcription API אמיתי
- **5 mood categories** — הוספת Sad ו-Angry (בנוסף ל-Sweet, Confused, Fear)
- **Loading messages** — מגוון הודעות per dream + lunar phase orb
- **Gallery boxes view** — תצוגת grid
- **Frosted glass layer** — post-processing layer על התמונות

---

## 2026-06-25–27

**מה עשינו:**
- **Supabase** — העברת storage מ-local files ל-Supabase (Postgres + Storage bucket)
- **Surreal-minimalist style** — הסגנון הפעיל נבחר ומוטמע
- **Hebrew/English i18n** — תשתית דו-לשונית, RTL support, LanguageProvider
- **Dream detail screen** — עיצוב מחדש
- **By Type view** — קטגוריות חלומות + dream-type detail page
- **Print** — הדפסת photo card
- **Responsive shell** — הסרת fixed phone-width
- **User screen** — עיצוב per Figma
- **Glass effect** — ניסויים שונים (Apple Liquid Glass style)

---

## 2026-06-23

**מה עשינו:**
- Next.js app shell עם mobile screens
- Dream storage (local files, לפני Supabase)
- ניסויי image styles (botanical-print, risograph, phantom-blur וכו')

---

## 2026-06-18

**מה עשינו:**
- Initial commit — pipeline ראשוני ב-TypeScript
- `src/analyze.ts` — ניתוח חלום → JSON
- `src/generate-image.ts` — יצירת תמונה
