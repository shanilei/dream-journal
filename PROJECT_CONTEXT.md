# Lucid — Dream Journal: Project Context

קובץ זה מיועד ל-handoff. הוא מכיל את ההחלטות שהתקבלו, הסטטוס האמיתי, ומה נשאר לעשות.
אין כאן ניחושים — רק מה שקיים בפועל ב-codebase.

---

## מה המוצר

אפליקציית יומן חלומות:
1. המשתמש מקליט חלום (קול) או מקליד אותו
2. המערכת מתמלל (Whisper), מנתחת (Claude), ומפיקה פרשנות + תמונה (Gemini Imagen)
3. החלום נשמר ב-Supabase עם תמונה, מצב רוח, סמלים, ו-keywords
4. ה-gallery וה-journey screen מציגים את היומן האישי

**שם המוצר בפועל:** Lucid (לא "Dream Journal" — זה שם ה-repo בלבד).

---

## סטאק

| שכבה | טכנולוגיה |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | CSS Modules |
| DB + Auth + Storage | Supabase (Postgres + pgvector + Storage) |
| AI — ניתוח ופרשנות | Anthropic Claude |
| AI — יצירת תמונה | Google Gemini Imagen (`gemini` flag ב-`generateImage`) |
| Fonts | Urbanist (Latin), Ploni (Hebrew), Alumni Sans |

---

## מבנה Routes

```
/               → Home screen (HomeScreenClient)
/onboarding     → Onboarding flow (OnboardingScreen)
/record         → הקלטת חלום קולי (page.tsx + VoiceRecordCircle)
/record/type    → הקלטת חלום טקסטואלית
/gallery        → גלריית חלומות (filter chips, grid/stack view)
/dream/[id]     → פרטי חלום בודד (DreamDetailClient)
/user           → Your Journey — סטטיסטיקות + patterns
```

---

## Pipeline מלא (src/app/api/dream/route.ts)

```
POST /api/dream (text)
  → analyzeDream()      [src/analyze.ts]       → JSON: mood, symbols, themes, emotions
  → interpretDream()    [src/interpret.ts]      → טקסט פרשנות
  → generateImage()     [src/generate-image.ts] → PNG (raw + clear)
  → Supabase Storage (dream-images bucket)
  → saveDream()         [src/dreams-store.ts]   → Supabase Postgres
```

---

## החלטות עיצוב שהתקבלו

### סגנון תמונות: surreal-minimalist
- הסגנון הפעיל ב-production הוא `surreal-minimalist` — **src/styles/surreal-minimalist.ts**
- נבדקו עשרות סגנונות אחרים (phantom-blur, lucid-system וכו') — כולם archived ב-`src/styles/`
- לא לשנות סגנון בלי בדיקה ויזואלית מפורשת

### כפתור ה-orb בהקלטה
- ה-orb הוא GIF (`/public/images/orb-anim.gif`) עם רקע שחור
- `mix-blend-mode: screen` על ה-button מבטל את הרקע השחור — **זה קריטי**
- **הבעיה שנפתרה:** `mix-blend-mode` לא עובד כשהאלמנט על GPU compositor layer נפרד
  - הפתרון: ה-button ממוקם עם `left: calc(50% - 130px)` (ללא `transform`), והאנימציה משתמשת ב-`scale` כ-Individual CSS property (לא `transform: scale()`)
  - **אסור** להוסיף `transform: translateX(-50%)` ל-button הזה — זה מחזיר את הריבוע

### דפי onboarding
- **src/components/OnboardingGate.tsx** — עוטף את ה-Home ומפנה ל-`/onboarding` אם המשתמש חדש
- בנויים עם אנימציית intro + starfield

### שפה דו-לשונית (עברית/אנגלית)
- **LanguageProvider** מנהל `lang` + `t` (translations)
- RTL/LTR נקבע ב-`<html dir>` via script מוקדם ב-layout.tsx
- פונט עברית: Ploni (`--font-ploni`)

### Design tokens
- **src/app/design-tokens.css** — מקור האמת לכל הצבעים. **אסור להמציא hex values חדשים** — רק ממשתנים שהוגדרו שם.

---

## רכיבים מרכזיים

| קובץ | תפקיד |
|---|---|
| `HomeScreenClient.tsx` | מסך הבית — CTA + כניסה לגלריה |
| `VoiceRecordCircle.tsx` | לוגיקת הקלטה (MediaRecorder API) |
| `DreamResultScreen.tsx` | מסך תוצאה אחרי ניתוח חלום |
| `DreamLoadingScreen.tsx` | אנימציית טעינה בזמן pipeline |
| `BottomNav.tsx` | ניווט תחתון (Home / Record / Gallery / User) |
| `GalleryNavBar.tsx` | NavBar של גלריה עם blur glass effect |
| `SettingsSheet.tsx` | Bottom sheet הגדרות (שפה, ערכת נושא, אורך פרשנות) |
| `YourJourneyScreen.tsx` | סטטיסטיקות + pattern cards + trends |
| `OnboardingScreen.tsx` | מסך הכניסה הראשון |

---

## מצב features

| Feature | סטטוס |
|---|---|
| הקלטה קולית + תמלול | ✅ עובד |
| הקלדת חלום | ✅ עובד |
| ניתוח Claude | ✅ עובד |
| פרשנות Claude | ✅ עובד |
| יצירת תמונה Gemini | ✅ עובד |
| שמירה ב-Supabase | ✅ עובד |
| גלריה + filter chips | ✅ עובד |
| דף פרטי חלום | ✅ עובד |
| Your Journey / סטטיסטיקות | ✅ עובד (מחושב מ-DB) |
| Onboarding | ✅ עובד |
| Auth / משתמשים | ❌ לא קיים — DB חשוף, כל חלום שייך לכולם |
| Push notifications / תזכורות | ❌ UI בלבד (SettingsSheet) — לא מחובר |
| Encryption at rest | ❌ לא קיים |
| מנוע דפוסים / pgvector | ❌ לא מומש |

---

## כללי ברזל (מה לא לשנות בלי אישור מפורש)

1. **`mix-blend-mode: screen` על `.recordButton`** — לא למחוק, לא להזיז לאלמנט אחר
2. **`left: calc(50% - 130px)` על `.recordButton`** — אסור להחליף ב-`transform: translateX(-50%)`
3. **`scale` (individual property) באנימציות ה-orb** — לא להמיר ל-`transform: scale()`
4. **design-tokens.css** — לא להמציא hex values שלא מוגדרים שם
5. **סגנון surreal-minimalist** — לא לשנות ב-production בלי validation ויזואלי
6. **אחד שלב בכל פעם** — לא לבנות auth + patterns ביחד

---

## קבצים שכדאי לקרוא לפני עבודה

- `src/analyze.ts` — סכימת ה-JSON שמחולץ מכל חלום (mood, symbols, themes, emotions, keywords)
- `src/interpret.ts` — ה-system prompt שקובע את טון הפרשנות
- `src/generate-image.ts` — איך הפרומפט נבנה ואיזה Gemini model בשימוש
- `src/dreams-store.ts` — schema של ה-DB ופונקציות CRUD
- `src/app/design-tokens.css` — כל ה-CSS variables
