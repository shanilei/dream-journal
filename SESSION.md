# SESSION LOG — Lucid

לוג עבודה יומי. מתעדכן בסוף כל יום עבודה.
הכי חדש — למעלה.

---

## 2026-07-08

### Decisions
- Onboarding background (glow blobs + starfield) is now mounted **once** at the page level instead of per-screen, so it never hard-cuts or resets when `phase` changes — screens crossfade over a continuous backdrop.
- Standardized onboarding transition choreography: exiting title fades out first, then the illustration/visual moves, then the next screen's content fades+slides in (`opacity 0, y:16px → opacity 1, y:0`), using `cubic-bezier(0.22, 1, 0.36, 1)` everywhere. Centralized in `src/components/onboarding/motion.ts` instead of ad-hoc per-screen values.
- Established (and then explicitly *rejected*) a heavier glassmorphism direction for the Insights ("Your Journey") screen — reverted to the app's existing flat-glass idiom on explicit feedback. See UX/Design system decisions below.
- Root-caused and fixed the record-screen orb "growing from a side" complaint: the background glow blobs use negative `animation-delay` for an eternal desynced shimmer, which meant they were already off-center at full opacity the instant the orb (scaling in from 0) mounted. Fix: glows now fade in from `opacity: 0` instead of snapping to full brightness, so the bias isn't visible while the orb is still small.
- Confirmed (via `getBoundingClientRect` tracking over the real entrance animation, not just screenshots) that the orb's own `scale` box-model was always dead-center — the bug was purely the glow layer, not the button/mask itself.

### Files modified
- `src/app/onboarding/page.tsx` — single `AnimatePresence` across all phases (was: instant swap for steps 1–3, separate handling for splash/language).
- `src/app/onboarding/onboarding.module.css` **(new)** — page-level shell (box model moved out of individual screens).
- `src/components/onboarding/OnboardingBackground.tsx` + `.module.css` **(new)** — persistent glow + two-layer parallax starfield.
- `src/components/onboarding/motion.ts` **(new)** — shared `screenVariants` / `titleVariants` / `visualVariants` / `illustrationVariants` / `footerVariants`.
- `src/components/onboarding/SplashScreen.tsx` / `.module.css`
- `src/components/onboarding/LanguagePickerScreen.tsx` / `.module.css`
- `src/components/onboarding/OnboardingStep.tsx` / `.module.css` (shared by Steps 1–3)
- `src/components/onboarding/CaptureIllustration.tsx` / `.module.css`
- `src/components/onboarding/Step1Welcome.tsx`, `Step2Capture.tsx`
- `src/app/record/record.module.css` — glow fade-in fix for the orb entrance.
- `src/components/YourJourneyScreen.tsx` + `.module.css` — Insights screen restyle (see below), divider removal, icon colors reverted to white.
- `src/i18n/translations.ts` — minor onboarding copy touch-ups.
- Committed as `47a1a4e`, pushed to `origin/main`.

### Remaining TODOs
- Unused leftover SVG assets from an earlier bubble-illustration experiment are still on disk, untracked: `public/images/onboarding/Frame 1171275486/487/488.svg`, `capture-bubble1/2/3.svg`, `capture-orb.svg`, `circle 3.svg`. Safe to delete — nothing in code references them anymore.
- No Hebrew-specific Figma frame has been provided yet for a couple of onboarding sub-states (flagged as open in an earlier session) — waiting on the user if/when they send it.

### Known bugs
- None currently open. Previously-open items from this session are resolved and verified via Playwright:
  - Orb "black circle" behind the blend-mode illustration (Step 2) — fixed earlier, and re-verified to still hold after the transition refactor.
  - Orb entrance appearing to grow from a side — fixed today (see Decisions).
- **Watch item, not a bug**: the Step 2 illustration slot can only animate `opacity` (no `y`/`scale`) because any transform on an ancestor of a `mix-blend-mode` element re-traps the blend and reintroduces the black-circle bug. Documented in `motion.ts`; keep in mind if a future illustration needs a "move" entrance.

### UX decisions
- No hard cuts anywhere in onboarding — every screen change is a soft crossfade over a continuous, gently parallaxing background.
- Insights screen should read "Apple Health meets a dreamy journal" — calm, flat, minimal; the dream artwork (pattern cards) is the focal point, not the containers.
- All icons on the Insights screen are white (explicit correction — an earlier pass color-coded icons per row/card, user asked to revert to white-only).
- Removed a horizontal divider under the "Dreams record" stat (between the number and the label) — kept the equivalent divider in the streak column since it still separates the number from the progress bar.

### Design system decisions
- Formalized the app's existing "flat glass" card recipe (reverse-engineered from `GalleryNavBar`'s pill and `DreamResultScreen`'s icon buttons/chips) as the standard for any new card: `background: rgba(255,255,255,0.05–0.06)`, `border: 1px solid rgba(255,255,255,0.1–0.12)`, `backdrop-filter: blur(20px)`, soft shadow only (`0 8px 20–32px rgba(0,0,0,0.2–0.25)`) — **no gradients, no colored borders, no glow halos behind icons/cards**.
- Color is only ever introduced via small details (a single icon, a progress bar fill) — never as a full-card tint or per-card accent theme.
- Onboarding motion system: `cubic-bezier(0.22, 1, 0.36, 1)` easing everywhere, new text always enters `opacity: 0, y: 16px → opacity: 1, y: 0`, staggered via a shared `screenVariants` container so timing stays consistent across all 5 onboarding screens.

### Next steps for tomorrow
- Clean up (delete) the unused onboarding SVG assets listed above.
- If the user provides the outstanding Hebrew Figma frame(s), implement and verify against it.
- Consider promoting the newly-formalized "flat glass" card recipe into a shared CSS class/token (e.g. in `design-tokens.css`) so future screens don't have to hand-roll the same three declarations.
- Keep an eye out for any other screen that might benefit from the same continuous-background/layered-transition treatment now proven out in onboarding.

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
