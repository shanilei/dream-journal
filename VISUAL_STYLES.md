# Dream Journal — מסגרת ויזואלית (שלב 3)

מסמך זה מגדיר את ה"DNA" הוויזואלי של התמונות שמלוות כל חלום - בדומה לאיך ש-`FRAMEWORK_SYSTEM_PROMPT` ב-`src/analyze.ts` מגדיר את ה-DNA של הניתוח הטקסטואלי.

## עקרון: Style קבוע + פרופיל משתנה
- **STYLE** - קבוע לכל התמונות (המסגרת האסתטית, ראה למטה)
- **Colors + Mood + Symbols** - משתנים לפי הרגש הדומיננטי בחלום (3 פרופילים, ראה למטה)

## STYLE NAME: Abstract Layered Print Collage

**רפרנס:** קולאז' אבסטרקטי שנראה כמו הדפס-משי (סריגרפיה) עם כמה שכבות צבע שקופות-למחצה, לא-מיושרות זו לזו (misregistration), על רקע נייר מיושן. מתוך השכבות "מתנשא" נוכחות מעורפלת של דמות (פרופיל/מהגב, בלי פנים, בלי קונטור נקי) - מורגשת ולא מצוירת. **אסור שיהיו אובייקטים/אייקונים מצוירים וברורים** (לא טלפון, לא דלת, לא בית, לא חיה) - הסמלים מהחלום משפיעים על הצבע/צורה/צפיפות של השכבות, לא על מה שמצויר בהן. **בלי טקסט, אותיות או מספרים בשום מקום בתמונה.**

**STYLE DESCRIPTION:**
Create a dream interpretation as an abstract layered print collage - like a hand-pulled screen-print (serigraphy) made of several overlapping color passes, on aged cream paper texture. Build the entire image from many overlapping translucent layers of flat color and texture - soft circles, irregular blobs, cloud shapes, and torn or rough-edged rectangular panels - each layer slightly offset/misregistered from the others, the way real screen-print passes shift out of alignment. Where layers overlap, colors blend into new tones, and each layer has visible halftone/grain/screenprint texture. Suggest one large, ambiguous figure-like presence somewhere in the composition - emerging from and partially dissolved into the layers, in profile or from behind, no facial features, no clean continuous outline - sensed rather than depicted.

**STYLE RULES:**
- abstract layered screen-print / serigraphy collage
- vintage / aged paper background texture
- many overlapping translucent color layers - circles, blobs, clouds, torn-edge panels - each slightly misregistered
- visible halftone/grain/screenprint texture within each layer
- one ambiguous, half-glimpsed figure-like presence, no clean outline, no face
- dream elements shape color/size/density/placement of layers - **never drawn as recognizable objects or icons**
- **never letters, words, numbers, or any text**
- full-bleed to the edges, no margin/border/frame
- ambiguous, dreamlike, rich color blending

**COMPOSITION:**
- many overlapping, slightly-offset translucent layers across the whole canvas
- one ambiguous central figure-presence, partially dissolved into the layers
- no isolated "clean" icons or vignettes - everything blends into everything else
- full-bleed, no border

**AVOID:**
- any text, letters, numbers, words, typography, or writing of any kind, anywhere in the image
- clearly recognizable objects, icons, or illustrated symbols (phones, doors, houses, animals, people as icons)
- flat single-color shapes with hard edges
- bold/clean outlines around the figure
- photorealism
- 3D rendering
- CGI aesthetics
- anime style
- comic book style
- realistic faces
- hard rectangular borders or icon-like framing
- sparse or empty composition
- literal scene recreation

**הערה לגבי אפקט הרקמה:** עם בסיס כהה (פרופיל fear) צפיפות 104 הפכה את התמונה לכהה ודחוסה מאוד - לבדוק צפיפות נמוכה יותר או פלטה מורחבת לתמונות כהות.

## 3 הפרופילים המשתנים (Colors + Mood + Symbols)

### 1. מתוק / נעים
- **Colors:** warm pastels — peach, soft butter-yellow, blush pink, sky blue, cream
- **Mood:** light, warm, nostalgic, gentle, glowing
- **Symbols:** rounded floating objects, soft light sources (sun/glow), small whimsical shapes drawn from the dream's content

### 2. מבולבל
- **Colors:** muted, desaturated, semi-translucent overlapping tones — grey, dusty lavender, faded beige, washed-out blue
- **Mood:** hazy, layered, disorienting, blurred boundaries
- **Symbols:** overlapping/duplicated silhouettes, fragmented or repeated shapes, ambiguous objects that blend into the background

### 3. פחד / חרדה
- **Colors:** deep, high-contrast — dark red, near-black, deep navy/olive
- **Mood:** tense, heavy, looming, shadowed (without breaking "soft imperfect edges")
- **Symbols:** oversized/looming central shapes, dense layering, enclosed or cornered composition, narrow negative space

## התהליך
1. נותנים לסקריפט/Claude את החלום
2. מנתחים אותו (emotions/characters/locations/symbols/themes)
3. בוחרים את אחד מ-3 הפרופילים לפי הרגש הדומיננטי
4. בונים prompt מלא = STYLE הקבוע + הפרופיל הנבחר + הסמלים הספציפיים מהחלום
5. שולחים ל-Gemini API ליצירת התמונה
6. (אופציונלי) מריצים את התמונה ב-`tools/stitch-filter.html` להוספת אפקט רקמה

## הערות
- מפתח ה-API נמצא ב-`.env` כ-`GEMINI_API_KEY` (חינמי, מ-aistudio.google.com)
- ל-Midjourney אין API רשמי - לכן Gemini הוא הספק שמחובר בפועל לקוד
