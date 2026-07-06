import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, basename, extname, join } from "node:path";
import type { DreamAnalysis } from "./analyze";
import { style as botanicalPrintStyle } from "./styles/botanical-print";
import { style as invertGlowStyle } from "./styles/invert-glow";
import { style as happyGlowStyle } from "./styles/happy-glow";
import { style as risographCollageStyle } from "./styles/risograph-collage";
import { style as neonCodeCollageStyle } from "./styles/neon-code-collage";
import { style as typewriterCollageStyle } from "./styles/typewriter-collage";
import { style as risographPosterStyle } from "./styles/risograph-poster";
import { style as phantomBlurStyle } from "./styles/phantom-blur";
import { style as dreamLayersStyle } from "./styles/dream-layers";
import { style as paintLayersStyle } from "./styles/paint-layers";
import { style as sprayOrganicStyle } from "./styles/spray-organic";
import { style as risoPanelsStyle } from "./styles/riso-panels";
import { style as lucidV1Style } from "./styles/lucid-v1";
import { style as lucidV2Style } from "./styles/lucid-v2";
import { style as dreamTopographyStyle } from "./styles/dream-topography";
import { style as dreamFragmentsStyle } from "./styles/dream-fragments";
import { style as dreamCollageStyle } from "./styles/dream-collage";
import { style as lucidSystemStyle } from "./styles/lucid-system";
import { style as surrealMinimalistStyle } from "./styles/surreal-minimalist";
import { applyMotionBlurLayer, applyFrostedGlassLayer } from "./image-postprocess";

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
  "paint-layers": paintLayersStyle,
  "spray-organic": sprayOrganicStyle,
  "riso-panels": risoPanelsStyle,
  "lucid-v1": lucidV1Style,
  "lucid-v2": lucidV2Style,
  "dream-topography": dreamTopographyStyle,
  "dream-fragments": dreamFragmentsStyle,
  "dream-collage": dreamCollageStyle,
  "lucid-system": lucidSystemStyle,
  "surreal-minimalist": surrealMinimalistStyle,
};


// ===== 3 פרופילים — נבחר אחד לפי הרגש הדומיננטי בחלום, ראה VISUAL_STYLES.md =====
export type ProfileKey = "sweet" | "confused" | "fear" | "sad" | "angry";

const PROFILES: Record<ProfileKey, string> = {
  sweet: `
Colors — Blossom Pink (#F7B8C4), Tangerine (#FF7D3B), Lime Foam (#C8F0A0), Warm Cream (#FFF3D6), Coral Ember (#F05C3A). Tangerine and Blossom Pink dominant and vivid, Lime Foam as a bright contrasting accent, Coral Ember as a deep warm anchor, Warm Cream bleeding at edges.
Mood: radiant, joyful, luminous, alive — not soft or muted, but vivid and celebratory.
Subjects: choose lush, abundant nature forms — ONE large central botanical form (a fully open flower head, a bursting ripe fruit, a dense cluster of petals) looming close to the camera or filling a large portion of the frame, surrounded by MANY smaller secondary elements scattered and layered across the remaining space (floating seeds, loose petals, small buds, pollen, tiny leaves, drifting fragments). The composition should feel dense with life and detail — a dominant large form with numerous small elements filling the frame, never a single isolated object on an empty backdrop.
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
  sad: `
Colors — Pale Silver (#D9DEE3), Faded Denim (#5B6B8C), Dusty Mauve (#7A6E7D), Slate Indigo (#2B3550), Ink Grey (#11131C). Slate Indigo and Ink Grey dominant and heavy, Faded Denim as mid layer, Pale Silver bleeding faintly at edges like weak light.
Mood: heavy, quiet, hollow, melancholic — stillness rather than threat.
Subjects: choose drooping, weary nature forms — wilted flowers, fallen petals, rain-soaked branches, bare drooping stems, empty seed pods. Quiet and slow, never violent or sharp.
`.trim(),
  angry: `
Colors — Blood Red (#B3261E), Scorched Orange (#D9621C), Soot Black (#1A0F0A), Charcoal (#2B2422), Ash Grey (#8C8278). Blood Red and Scorched Orange dominant and hot, Soot Black and Charcoal as dense foundation, Ash Grey bleeding at edges like smoke.
Mood: hot, jagged, combustible, tense.
Subjects: choose sharp, aggressive nature forms — thorned brambles, cracked scorched bark, jagged broken branches, blackened leaves. Intense and sharp-edged, never soft or rounded.
`.trim(),
};

// פלטות צבע מילוליות (לא hex, בלי "Subjects:") לסגנונות אבסטרקטיים — נבחרות לפי הרגש הדומיננטי בלבד
const ABSTRACT_MOOD_COLORS: Record<ProfileKey, string> = {
  fear: "dark moss green, charcoal grey, deep black, cold ash grey",
  sweet: "soft pink, warm coral, peachy orange, gentle red",
  confused: "electric indigo, deep cyan-blue, dark violet, cool slate grey",
  sad: "slate grey, faded denim blue, dusty lavender, pale silver",
  angry: "blood red, scorched orange, charcoal black, ash grey",
};

// פלטת 4 צבעים מדויקת לכל מצב-רוח, לפי "Lucid Visual Style System v1"
const LUCID_MOOD_COLORS: Record<ProfileKey, string> = {
  sweet: "soft pink, warm coral, peach orange, cream",
  confused: "dusty lavender, muted beige, faded blue, soft grey",
  fear: "deep red, burnt orange, dark olive, near black",
  sad: "slate blue, faded grey, dusty mauve, pale silver",
  angry: "blood red, burnt orange, charcoal black, rust",
};

// פלטת הצבעים לפי כללי ה-COLOR RULES של "LUCID VISUAL SYSTEM" (הספסיפיקציה החדשה)
const LUCID_SYSTEM_COLORS: Record<ProfileKey, string> = {
  sweet: "peach, coral, cream, gold, blush pink, soft apricot",
  confused: "muted blue, lavender, beige, grey, dusty mauve, faded teal",
  fear: "charcoal, navy, olive, burgundy, rust, slate grey",
  sad: "slate blue, faded denim, dove grey, dusty mauve, pale silver, muted indigo",
  angry: "blood red, scorched orange, charcoal, soot black, rust, ash grey",
};

// רקע שטוח וצבעוני לכל מצב-רוח, לפי "SURREAL MINIMALIST & ANALOG DREAMSCAPE" — תואם לתמונות הרפרנס שהמשתמש שלח
const SURREAL_MINIMALIST_COLORS: Record<ProfileKey, string> = {
  sweet: "a vivid coral-pink to warm orange gradient sky, or a lush light-green environment alive with scattered petals and golden light — saturated and luminous, not pale or pastel",
  confused: "a deep forest-teal environment layered with dusty violet atmosphere, or a dense indigo-to-moss-green gradient",
  fear: "a heavily textured dark olive and charcoal environment, or a dramatic deep-teal-to-near-black atmospheric gradient with flickers of cold jade green",
  sad: "a muted dusty-mauve and slate-indigo landscape, or a dense fog-grey environment with faint lavender undertones and dim diffused light",
  angry: "a scorched burnt-sienna and deep rust environment, or a richly saturated blood-orange atmospheric gradient with dark charcoal edges",
};

// מילות מפתח לזיהוי רגש דומיננטי → פרופיל
const EMOTION_KEYWORDS: Record<ProfileKey, string[]> = {
  fear: ["פחד", "חרדה", "מתח", "איום", "בהלה", "דחק", "לחץ", "fear", "anxiety", "panic", "dread", "stress", "threat"],
  confused: ["בלבול", "תהייה", "חוסר וודאות", "אובדן כיוון", "מבולבל", "confusion", "confused", "disoriented", "uncertainty"],
  sweet: ["שמחה", "אהבה", "נוסטלגיה", "חמימות", "התרגשות", "כיף", "joy", "love", "warmth", "nostalgia", "excitement", "happiness"],
  sad: ["עצב", "עצבות", "אבל", "געגוע", "יגון", "דכדוך", "sad", "sadness", "grief", "loss", "melancholy", "sorrow"],
  angry: ["כעס", "תסכול", "עצבים", "רוגז", "זעם", "anger", "angry", "frustration", "rage", "fury", "resentment"],
};

export function pickProfile(analysis: DreamAnalysis): ProfileKey {
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

const ABSTRACT_STYLES = new Set(["dream-layers", "paint-layers", "spray-organic", "phantom-blur"]);

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
      ? `Use the blur and light to evoke this feeling: ${analysis.themes?.join(", ") || "dreamlike tension"}. The anchor form, if it emerges, should stay too dissolved to fully name — a vague silhouette, a smear of color, a shadow — never a sharp or detailed figure.`
      : styleName === "risograph-poster"
      ? analysis.visual_scene
        ? `The main engraved illustration hero should depict: ${analysis.visual_scene}. Choose the single most powerful visual symbol from this scene as the large engraved subject. The coral-red graphic overlay numerals and diagonal lines should feel like an exhibition or data annotation on top of the engraving.`
        : `The main engraved illustration hero should depict the most visually striking element from these dream symbols, rendered as a large detailed vintage naturalist engraving: ${elements || "(none specified)"}. The coral-red graphic overlay numerals and diagonal lines should feel like an exhibition annotation.`
      : styleName === "riso-panels"
      ? analysis.visual_scene
        ? `The flat silhouette scene (Layer 1) should depict: ${analysis.visual_scene}. Keep it as one flat graphic silhouette — no internal detail, no shading.`
        : `The flat silhouette scene (Layer 1) should depict the dream's central moment: ${elements || analysis.themes?.join(", ") || "the dream's atmosphere"}. Keep it as one flat graphic silhouette — no internal detail, no shading.`
      : styleName === "lucid-v1"
      ? `Choose ONE dominant central form — strongly PREFER a non-human element from these dream symbols/locations: ${elements || "abstract organic form"}. Only fall back to a human presence if nothing else fits, and if you do, follow the HUMAN REPRESENTATION rules strictly — density/pixel/fragment masses only, never a resolved face, never a portrait, never visible facial features. Apply the emotional-translation rules to this dream's specific feeling: ${analysis.themes?.join(", ") || "dreamlike energy"}.`
      : styleName === "lucid-v2"
      ? `Choose ONE dominant central form from these dream symbols/locations, always a non-human object, animal, plant, or place: ${elements || "abstract organic form"}. Apply the emotional-translation rules to this dream's specific feeling: ${analysis.themes?.join(", ") || "dreamlike energy"}.`
      : styleName === "dream-topography"
      ? `Translate this dream into emotional territories only — never literal objects, figures, or symbols. These dream elements may influence territory boundaries, density, and overlap, but must never appear as recognizable shapes: ${elements || "the dream's symbols"}. Apply the EMOTIONAL TRANSLATION RULES to this dream's specific feeling: ${analysis.themes?.join(", ") || "dreamlike energy"}.`
      : styleName === "dream-fragments"
      ? `Draw 3–7 incomplete fragments loosely hinted by these dream symbols/locations — each one partial, cropped, dissolved, buried, or merged into the surrounding color field, never a complete or fully recognizable object: ${elements || "abstract dream remnants"}. Apply the emotional atmosphere of this dream's specific feeling: ${analysis.themes?.join(", ") || "dreamlike energy"}.`
      : styleName === "dream-collage"
      ? `Translate this dream into 4–8 emotional/sensory associations per the DREAM TRANSLATION METHOD above — never the literal event. Draw associations from these symbols and themes without depicting any of them directly: ${elements || "the dream's symbols"}; ${analysis.themes?.join(", ") || "dreamlike energy"}. Each association becomes one incomplete, partially-hidden visual layer.`
      : styleName === "lucid-system"
      ? `Identify the Anchor, the Emotional Field, and the Intrusion for this specific dream — these elements and themes are emotional raw material only, never a literal object, scene, or recognizable equipment to draw: ${elements || "the dream's symbols"}. Anchor (the emotional center): build it from several overlapping layered fragments and patches that together suggest a feeling — never a single clean shape, and never a literal illustration of any specific symbol listed above (e.g. no medical equipment, no literal hospital or military iconography, no crosses, no vehicles, no architecture). Emotional Field (secondary shapes spreading the atmosphere): drawn from ${analysis.themes?.join(", ") || "the dream's emotional atmosphere"}. Intrusion (the force that disrupts, transforms, threatens, attracts, divides, or overwhelms the Anchor): infer it from the tension between the Anchor and the dream's themes. Choose ONE dominant shape family (circles and rounded forms; particles and repetition; arches and portals; waves and flowing forms; fractures and shards; or clouds and soft masses) that best fits this dream, and let it drive most of the image.`
      : styleName === "surreal-minimalist"
      ? `ABSOLUTELY NO TEXT anywhere in the image — no letters, words, numbers, labels, or symbols of any kind. NO glass panels, glass frames, frosted windows, or any rectangular overlay that creates a picture-within-a-picture — the image must be a single unified scene.

STRICT ELEMENT RULE — MOST IMPORTANT: Use ONLY the elements listed below. Do NOT infer, add, or substitute thematically related objects. If the dream contains a sea but no boat, draw no boat. If it contains a figure but no tree, draw no tree. If it contains a mask but no costume, draw no costume. The list is exhaustive — nothing outside it belongs in the image. Elements: ${elements || analysis.themes?.join(", ") || "the dream's central image"}.

Render each listed element literally and sharply — recognizable on close inspection. Surrealism comes from their combination and context, not from adding new props.

COMPOSITION — NO FLOATING OBJECTS IN VOID: Every subject must exist within a real environment. Ground figures in water, place objects on surfaces, embed forms in atmosphere, let elements interact with their surroundings. Choose one of these composition strategies: (A) a large figure or form looming close to camera, nearly filling the frame, with the environment pressing in around it; (B) a wide environmental scene — water, sky, landscape — with the subject placed unexpectedly small at one corner; (C) two or more elements from the list in direct spatial tension — overlapping, facing each other, one casting a shadow on the other. Never: a single isolated object centered on a flat colored void.

Combine the elements in a surreal magical-realism context — impossible scale, wrong environment, or unexpected juxtaposition. Render this as a clean, sharp photograph — a motion-blur pass is added afterward. You may optionally use abstract directional blur on one specific element, or Orton-effect glow from bright areas. Never apply blanket lens blur or soft focus across the whole image.`
      : ABSTRACT_STYLES.has(styleName)
      ? `Do NOT render any of these as literal recognizable objects or figures: ${elements || "the dream's symbols"}. Let them influence ONLY the weight, density, and rhythm of the abstract shapes/patches — denser and heavier for tension, lighter and looser for ease. The sensation to evoke: ${analysis.themes?.join(", ") || "dreamlike energy"}. Every shape stays an abstract patch or mass, never a named thing.`
      : `Incorporate these specific dream elements as glowing, symbolic, dreamlike forms within the composition — each rendered with its own color glow stroke, layered and overlapping at different scales and blur depths: ${elements || "(none specified)"}.`;

  const profileSection =
    styleName === "lucid-v1" || styleName === "lucid-v2"
      ? `FOUR COLORS: Use exactly these four named colors as the dominant palette — ${LUCID_MOOD_COLORS[profile]}. No other hues.`
      : styleName === "dream-topography"
      ? `FOUR COLORS ONLY: Use exactly these four named colors as the dominant palette — ${analysis.palette?.length ? analysis.palette.join(", ") : ABSTRACT_MOOD_COLORS[profile]}. No other hues, no rainbow palette.`
      : styleName === "dream-fragments"
      ? `FOUR COLORS ONLY: Use exactly these four named colors as the dominant palette — ${analysis.palette?.length ? analysis.palette.join(", ") : ABSTRACT_MOOD_COLORS[profile]}. No other hues, no rainbow palette.`
      : styleName === "dream-collage"
      ? `FOUR COLORS ONLY: Use exactly these four named colors as the dominant palette — ${analysis.palette?.length ? analysis.palette.join(", ") : ABSTRACT_MOOD_COLORS[profile]}. No other hues, no rainbow palette.`
      : styleName === "lucid-system"
      ? `COLOR RULES: Use exactly these four to six named colors as the dominant palette, chosen by emotion, not objects — ${LUCID_SYSTEM_COLORS[profile]}. No other hues, no rainbow palette.`
      : styleName === "riso-panels"
      ? `MOOD LEAN: Stay strictly within the established coral/orange/mustard/teal family — do not introduce other hues. Lean warmer (more coral/mustard) or cooler (more teal) based on this dream's mood: ${analysis.themes?.join(", ") || "dreamlike energy"}.`
      : styleName === "surreal-minimalist"
      ? `FLAT BACKDROP COLOR: The sky or backdrop must be ${SURREAL_MINIMALIST_COLORS[profile]} — a bold, unbroken, color-blocked expanse. The foreground subject and environment should contrast cleanly against it, never blend in.`
      : ABSTRACT_STYLES.has(styleName)
      ? `COLOR DIRECTION: Use exactly these named colors as the dominant palette — ${analysis.palette?.length ? analysis.palette.join(", ") : ABSTRACT_MOOD_COLORS[profile]}. No named objects, pure color sensation only.`
      : PROFILES[profile];

  if (styleName === "riso-panels") {
    return `
${elementsInstruction}

${styleText}

${profileSection}
`.trim();
  }

  return `
${styleText}

${profileSection}

${elementsInstruction}
`.trim();
}

export interface GeneratedImagePaths {
  rawPath: string; // התמונה הסופית, אחרי טשטוש התנועה ואפקט הזכוכית
  clearPath: string; // אותה תמונה לפני העיבוד — לאפקט "ההתבהרות" בהובר/מגע
  prompt: string; // הפרומפט המלא שנשלח למודל ליצירת התמונה
}

export async function generateImage(
  analysis: DreamAnalysis,
  outputPath: string,
  styleName = "botanical-print",
  refImagePath?: string,
  engine: "gemini" | "imagen" | "stability" = "gemini",
  seed?: number,
  cfgScale?: number
): Promise<GeneratedImagePaths> {
  const profile = pickProfile(analysis);
  const styleText = STYLES[styleName] ?? STYLES["botanical-print"];
  const prompt = buildPrompt(analysis, profile, styleText, styleName);

  console.log(`פרופיל נבחר: ${profile}`);
  console.log("Prompt:\n" + prompt + "\n");

  const ext = extname(outputPath);
  const base = join(dirname(outputPath), basename(outputPath, ext));
  const rawPath = `${base}-raw${ext}`;
  const clearPath = `${base}-clear${ext}`;

  if (engine === "stability") {
    const negativePrompt = ABSTRACT_STYLES.has(styleName)
      ? "person, human figure, face, body, silhouette, photorealistic photograph, cinematic portrait, man, woman, character, stock photo, movie poster, illustration, cartoon"
      : styleName === "riso-panels"
      ? "text, letters, words, writing, typography, labels, captions, watermark, signature, logo, landscape, mountains, sunset, nature scene, travel poster, river, hills, double exposure, forest, trees, birds, cliff, ocean, horizon, face profile, head silhouette"
      : styleName === "lucid-v1"
      ? "text, letters, words, writing, readable typography, watermark, signature, logo, broken computer screen, error message, UI window, desktop interface, rainbow palette, photorealistic photograph, realistic face, recognizable face, human face, facial features, portrait, detailed body, character illustration"
      : styleName === "lucid-v2"
      ? "person, people, human, human figure, face, facial features, portrait, body, body part, hand, eye, character, silhouette of a person, text, letters, words, writing, readable typography, watermark, signature, logo, broken computer screen, error message, UI window, desktop interface, rainbow palette, photorealistic photograph"
      : styleName === "dream-topography"
      ? "person, people, human, human figure, face, faces, eyes, body, bodies, silhouette, portrait, animal, animals, creature, building, buildings, house, vehicle, vehicles, recognizable object, symbol, letters, numbers, text, words, writing, typography, logo, watermark, signature, photorealistic photograph, cartoon, illustration, character, landscape horizon, realistic sky"
      : styleName === "dream-fragments"
      ? "person, people, human, human figure, face, faces, eyes, body, bodies, silhouette, portrait, character, animal, animals, complete object, complete building, house, map, geographic map, topographic map, river, mountain, topographic graphics, legend, chart, infographic, diagram, typography, numbers, letters, text, words, writing, logo, watermark, signature, photorealistic photograph, cartoon, illustration, realistic landscape, realistic sky"
      : styleName === "dream-collage"
      ? "person, people, human, human figure, face, faces, eyes, body, bodies, silhouette, profile silhouette, head silhouette, portrait, character, double exposure, multiple exposure, person walking, person standing, figure on stairs, staircase, person on a cliff, complete object, realistic scene, landscape, mountain, moon, map, architecture, building, fantasy illustration, glossy render, CGI, 3d render, photorealistic photograph, photorealism, cartoon, typography, letters, numbers, text, words, writing, logo, watermark, signature"
      : styleName === "lucid-system"
      ? "person, people, human, human figure, face, faces, eyes, body, bodies, silhouette, portrait, character, realistic people, photorealistic photograph, cinematic realism, detailed environment, realistic room, realistic landscape, glossy render, CGI, 3d render, cartoon, typography, letters, numbers, text, words, writing, logo, watermark, signature"
      : styleName === "surreal-minimalist"
      ? "text, letters, words, numbers, writing, typography, labels, captions, watermark, signature, logo, centered composition, centered subject, floating object in void, plain white background, plain red background, plain gray background, plain light blue background, illustration, painting, 3d render, cartoon, anime"
      : undefined;

    const form = new FormData();
    form.append("prompt", prompt);
    form.append("model", "sd3.5-large");
    form.append("aspect_ratio", "2:3");
    form.append("output_format", "png");
    if (negativePrompt) form.append("negative_prompt", negativePrompt);
    if (seed !== undefined) form.append("seed", String(seed));
    if (cfgScale !== undefined) form.append("cfg_scale", String(cfgScale));

    const stabilityResponse = await fetch("https://api.stability.ai/v2beta/stable-image/generate/sd3", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        Accept: "image/*",
      },
      body: form,
    });

    if (!stabilityResponse.ok) {
      const errText = await stabilityResponse.text();
      throw new Error(`Stability AI שגיאה (${stabilityResponse.status}): ${errText}`);
    }

    const clearImage = Buffer.from(await stabilityResponse.arrayBuffer());
    const rawImage = await applyFrostedGlassLayer(await applyMotionBlurLayer(clearImage));
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(rawPath, rawImage);
    writeFileSync(clearPath, clearImage);
    console.log(`התמונה הנקייה נשמרה ב: ${rawPath}`);
    return { rawPath, clearPath, prompt };
  }

  if (engine === "imagen") {
    const imagenResponse = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt,
      config: { numberOfImages: 1, aspectRatio: "3:4" },
    });
    const imageBytes = imagenResponse.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      throw new Error("Imagen לא החזיר תמונה");
    }
    const clearImage = Buffer.from(imageBytes, "base64");
    const rawImage = await applyFrostedGlassLayer(await applyMotionBlurLayer(clearImage));
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(rawPath, rawImage);
    writeFileSync(clearPath, clearImage);
    console.log(`התמונה הנקייה נשמרה ב: ${rawPath}`);
    return { rawPath, clearPath, prompt };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let contents: any = prompt;
  if (refImagePath && existsSync(refImagePath)) {
    const ext = refImagePath.split(".").pop()?.toLowerCase() ?? "jpeg";
    const mimeType = ext === "png" ? "image/png" : "image/jpeg";
    const imageData = readFileSync(refImagePath).toString("base64");
    contents = [
      {
        role: "user",
        parts: [
          { text: `Use the provided image as a strict visual style reference — adopt its texture, atmosphere, layering technique, and overall aesthetic. Apply this style to the following prompt:\n\n${prompt}` },
          { inlineData: { mimeType, data: imageData } },
        ],
      },
    ];
    console.log(`תמונת רפרנס נטענה: ${refImagePath}`);
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.text) {
      console.log("תגובת טקסט מהמודל:", part.text);
    } else if (part.inlineData?.data) {
      const clearImage = Buffer.from(part.inlineData.data, "base64");
      const rawImage = await applyFrostedGlassLayer(await applyMotionBlurLayer(clearImage));

      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(rawPath, rawImage);
      writeFileSync(clearPath, clearImage);
      console.log(`התמונה הנקייה נשמרה ב: ${rawPath}`);

      return { rawPath, clearPath, prompt };
    }
  }
  throw new Error("המודל לא החזיר תמונה");
}

// ===== הרצה מהטרמינל =====
// שימוש: npm run generate-image -- --file analysis.json [--out images/dream.png] [--style invert-glow]
async function main() {
  const args = process.argv.slice(2);
  const fileFlag = args.indexOf("--file");

  if (fileFlag === -1 || !args[fileFlag + 1]) {
    console.error(`שימוש:\n  npm run generate-image -- --file analysis.json [--out images/dream.png] [--style ${Object.keys(STYLES).join("|")}]`);
    process.exit(1);
  }

  const analysis: DreamAnalysis = JSON.parse(readFileSync(args[fileFlag + 1], "utf-8"));
  const outFlag = args.indexOf("--out");
  const outputPath = outFlag !== -1 && args[outFlag + 1] ? args[outFlag + 1] : "images/dream.png";
  const styleFlag = args.indexOf("--style");
  const styleName = styleFlag !== -1 && args[styleFlag + 1] ? args[styleFlag + 1] : "botanical-print";
  const refFlag = args.indexOf("--ref");
  const refImagePath = refFlag !== -1 && args[refFlag + 1] ? args[refFlag + 1] : undefined;
  const engineFlag = args.indexOf("--engine");
  const engineArg = engineFlag !== -1 ? args[engineFlag + 1] : undefined;
  const engine = engineArg === "imagen" || engineArg === "stability" ? engineArg : "gemini";
  const seedFlag = args.indexOf("--seed");
  const seed = seedFlag !== -1 && args[seedFlag + 1] ? Number(args[seedFlag + 1]) : undefined;
  const cfgFlag = args.indexOf("--cfg");
  const cfgScale = cfgFlag !== -1 && args[cfgFlag + 1] ? Number(args[cfgFlag + 1]) : undefined;

  if (!STYLES[styleName]) {
    console.error(`סגנון לא מוכר: "${styleName}". אפשרויות: ${Object.keys(STYLES).join(", ")}`);
    process.exit(1);
  }

  await generateImage(analysis, outputPath, styleName, refImagePath, engine, seed, cfgScale);
}

// מריצים את main רק כשהקובץ מורץ ישירות (לא כשמייבאים את generateImage)
const isDirectRun = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  main().catch((err) => {
    console.error("שגיאה:", err.message);
    process.exit(1);
  });
}
