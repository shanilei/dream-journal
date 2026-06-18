import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, basename, extname, join } from "node:path";
import type { DreamAnalysis } from "./analyze.js";
import { applyStitchEffect } from "./stitch.js";
import { style as botanicalPrintStyle } from "./styles/botanical-print.js";
import { style as invertGlowStyle } from "./styles/invert-glow.js";
import { style as happyGlowStyle } from "./styles/happy-glow.js";
import { style as risographCollageStyle } from "./styles/risograph-collage.js";
import { style as neonCodeCollageStyle } from "./styles/neon-code-collage.js";
import { style as typewriterCollageStyle } from "./styles/typewriter-collage.js";
import { style as risographPosterStyle } from "./styles/risograph-poster.js";
import { style as phantomBlurStyle } from "./styles/phantom-blur.js";
import { style as dreamLayersStyle } from "./styles/dream-layers.js";

const ai = new GoogleGenAI({}); // קורא את GEMINI_API_KEY מהסביבה

const MODEL = "gemini-2.5-flash-image";

// ===== רישום סגנונות — הוסף כאן סגנונות חדשים =====
const STYLES: Record<string, string> = {
  "botanical-print": botanicalPrintStyle,
  "invert-glow": invertGlowStyle,
  "happy-glow": happyGlowStyle,
  "risograph-collage": risographCollageStyle,
  "neon-code-collage": neonCodeCollageStyle,
  "typewriter-collage": typewriterCollageStyle,
  "risograph-poster": risographPosterStyle,
  "phantom-blur": phantomBlurStyle,
  "dream-layers": dreamLayersStyle,
};


// ===== 3 פרופילים — נבחר אחד לפי הרגש הדומיננטי בחלום, ראה VISUAL_STYLES.md =====
type ProfileKey = "sweet" | "confused" | "fear";

const PROFILES: Record<ProfileKey, string> = {
  sweet: `
Colors — Honeydew (#F6FFEA), Soft Peach (#FFDE96), Coral Glow (#FA855A), Tomato Jam (#C93638), Sky Blue (#62C4DA). Coral Glow and Soft Peach dominant, Sky Blue as contrast, Tomato Jam as deep anchor, Honeydew bleeding at edges.
Mood: warm, soft, glowing, nostalgic.
Subjects: choose soft, delicate nature forms — blooming flowers, open petals, light floating seeds, gentle leaves, soft organic shapes. Warm and tender, not dark or eerie.
`.trim(),
  confused: `
Colors — Frozen Water (#D9FCED), Electric Sapphire (#405FFA), Strong Cyan (#09BBC8), Twilight Indigo (#3B3664), Evergreen (#07240F). Electric Sapphire and Strong Cyan dominant, Twilight Indigo and Evergreen as dark foundation, Frozen Water bleeding at edges.
Mood: overwhelming, disorienting, electric — too bright and too dark at once.
Subjects: choose disorienting, shifting organic forms — spiraling plants, tangled vines, overlapping repeated forms, organisms that seem to multiply or fragment.
`.trim(),
  fear: `
Colors — Icy Aqua (#AFFDF0), Light Green (#BEEF8D), Deep Teal (#3A745D), Space Indigo (#393A4F), Pitch Black (#241D01). Space Indigo and Pitch Black dominant and heavy, Deep Teal as mid layer, Icy Aqua and Light Green bleeding as cold cracks of light.
Mood: suffocating, cold, looming, tense.
Subjects: choose dense, heavy, threatening organic forms — dark thorned plants, deep-sea organisms, heavy moss, roots pressing inward, forms that loom from shadow. Nothing domestic or recognizable as an object.
`.trim(),
};

// מילות מפתח לזיהוי רגש דומיננטי → פרופיל
const EMOTION_KEYWORDS: Record<ProfileKey, string[]> = {
  fear: ["פחד", "חרדה", "מתח", "איום", "בהלה", "דחק", "לחץ", "fear", "anxiety", "panic", "dread", "stress", "threat"],
  confused: ["בלבול", "תהייה", "חוסר וודאות", "אובדן כיוון", "מבולבל", "confusion", "confused", "disoriented", "uncertainty"],
  sweet: ["שמחה", "אהבה", "נוסטלגיה", "חמימות", "התרגשות", "כיף", "joy", "love", "warmth", "nostalgia", "excitement", "happiness"],
};

function pickProfile(analysis: DreamAnalysis): ProfileKey {
  const sortedEmotions = [...analysis.emotions].sort((a, b) => b.intensity - a.intensity);
  for (const emotion of sortedEmotions) {
    const name = emotion.name.toLowerCase();
    for (const [profile, keywords] of Object.entries(EMOTION_KEYWORDS) as [ProfileKey, string[]][]) {
      if (keywords.some((kw) => name.includes(kw.toLowerCase()))) {
        return profile;
      }
    }
  }
  return "confused"; // ברירת מחדל - הפרופיל הניטרלי ביותר
}

function buildPrompt(analysis: DreamAnalysis, profile: ProfileKey, styleText: string, styleName: string): string {
  const elements = [...analysis.symbols, ...analysis.locations].filter(Boolean).join(", ");

  const elementsInstruction =
    styleName === "risograph-collage"
      ? `Do NOT render any recognizable objects, symbols, or illustrations. Keep every shape purely abstract — blobs, panels, color zones only. Let the dream's emotional mood (${analysis.themes?.join(", ") || "dream atmosphere"}) influence only the weight and rhythm of the composition: heavier darker shapes for tension, lighter floating forms for lightness. All white elements must be simple abstract graphic marks — no objects.`
      : styleName === "neon-code-collage"
      ? `Sculpt 2 large figures from the character field using the light-and-shadow technique described above. Figure 1: a large dog submerged in water — body lit from above, legs fading into dense dark characters below as it sinks. Figure 2: a turbulent wave mass — layered rolling form, bright sparse characters at the crest, dense dark characters in the depths. Do NOT write any words or labels — only sculpt these forms through character density and color variation.`
      : styleName === "typewriter-collage"
      ? analysis.visual_scene
        ? `The painted background and typewriter-cutout figures should depict this specific scene: ${analysis.visual_scene}. Render the key figures or objects as large typewriter-text cutout silhouettes — each filled with dense random typed characters on white/cream — placed over the painted classical background. Apply pixel glitch blocks where the narrative tension is strongest.`
        : `The painted background should evoke the dream's emotional atmosphere: ${[...analysis.locations, ...analysis.themes].join(", ")}. Render 2 large symbolic figures as typewriter-text cutout silhouettes over the painted background: ${elements}. Apply pixel glitch blocks at points of tension.`
      : styleName === "dream-layers"
      ? `Translate this dream's emotional energy into pure color, light, and movement — no figures, no objects, no narrative. The sensation to evoke: ${analysis.themes?.join(", ") || "dreamlike energy"}. Express this as: the direction light moves, how warm or cool the atmosphere feels, how fast or slow the layers shift. Nothing literal. Only sensation.`
      : styleName === "phantom-blur"
      ? `Do NOT depict any literal objects, animals, or figures. Instead, translate the dream's emotional atmosphere into pure visual sensation — light, color, movement, and depth. The feeling to evoke: ${analysis.themes?.join(", ") || "dreamlike tension"}. Use the blur and light to suggest a PLACE or EMOTIONAL STATE, not a thing. If any shape emerges from the blur, it should be too dissolved to name — a vague silhouette, a smear of color, a shadow.`
      : styleName === "risograph-poster"
      ? analysis.visual_scene
        ? `The main engraved illustration hero should depict: ${analysis.visual_scene}. Choose the single most powerful visual symbol from this scene as the large engraved subject. The coral-red graphic overlay numerals and diagonal lines should feel like an exhibition or data annotation on top of the engraving.`
        : `The main engraved illustration hero should depict the most visually striking element from these dream symbols, rendered as a large detailed vintage naturalist engraving: ${elements || "(none specified)"}. The coral-red graphic overlay numerals and diagonal lines should feel like an exhibition annotation.`
      : `Incorporate these specific dream elements as glowing, symbolic, dreamlike forms within the composition — each rendered with its own color glow stroke, layered and overlapping at different scales and blur depths: ${elements || "(none specified)"}.`;

  return `
${styleText}

${PROFILES[profile]}

${elementsInstruction}
`.trim();
}

export interface GeneratedImagePaths {
  rawPath: string; // הקולאז' הנקי מ-Gemini, ללא אפקט רקמה
  stitchedPath: string; // אותה תמונה עם אפקט הרקמה
}

// שתי הגרסאות נשמרות כדי לאפשר ב-UI "סליידר" בין הקולאז' הנקי לגרסה הרקומה
export async function generateImage(
  analysis: DreamAnalysis,
  outputPath: string,
  rawOnly = false,
  styleName = "botanical-print"
): Promise<GeneratedImagePaths> {
  const profile = pickProfile(analysis);
  const styleText = STYLES[styleName] ?? STYLES["botanical-print"];
  const prompt = buildPrompt(analysis, profile, styleText, styleName);

  console.log(`פרופיל נבחר: ${profile}`);
  console.log("Prompt:\n" + prompt + "\n");

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  const ext = extname(outputPath);
  const base = join(dirname(outputPath), basename(outputPath, ext));
  const rawPath = `${base}-raw${ext}`;
  const stitchedPath = `${base}-stitched${ext}`;

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.text) {
      console.log("תגובת טקסט מהמודל:", part.text);
    } else if (part.inlineData?.data) {
      const rawImage = Buffer.from(part.inlineData.data, "base64");

      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(rawPath, rawImage);
      console.log(`התמונה הנקייה נשמרה ב: ${rawPath}`);

      if (!rawOnly) {
        const stitched = await applyStitchEffect(rawImage);
        writeFileSync(stitchedPath, stitched);
        console.log(`התמונה עם אפקט הרקמה נשמרה ב: ${stitchedPath}`);
      }

      return { rawPath, stitchedPath: rawOnly ? "" : stitchedPath };
    }
  }
  throw new Error("המודל לא החזיר תמונה");
}

// ===== הרצה מהטרמינל =====
// שימוש: npm run generate-image -- --file analysis.json [--out images/dream.png] [--style invert-glow] [--raw-only]
async function main() {
  const args = process.argv.slice(2);
  const fileFlag = args.indexOf("--file");

  if (fileFlag === -1 || !args[fileFlag + 1]) {
    console.error(`שימוש:\n  npm run generate-image -- --file analysis.json [--out images/dream.png] [--style ${Object.keys(STYLES).join("|")}] [--raw-only]`);
    process.exit(1);
  }

  const analysis: DreamAnalysis = JSON.parse(readFileSync(args[fileFlag + 1], "utf-8"));
  const outFlag = args.indexOf("--out");
  const outputPath = outFlag !== -1 && args[outFlag + 1] ? args[outFlag + 1] : "images/dream.png";
  const rawOnly = args.includes("--raw-only");
  const styleFlag = args.indexOf("--style");
  const styleName = styleFlag !== -1 && args[styleFlag + 1] ? args[styleFlag + 1] : "botanical-print";

  if (!STYLES[styleName]) {
    console.error(`סגנון לא מוכר: "${styleName}". אפשרויות: ${Object.keys(STYLES).join(", ")}`);
    process.exit(1);
  }

  await generateImage(analysis, outputPath, rawOnly, styleName);
}

main().catch((err) => {
  console.error("שגיאה:", err.message);
  process.exit(1);
});
