
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";

const client = new Anthropic(); // קורא את ANTHROPIC_API_KEY מהסביבה

const MODEL = "claude-sonnet-4-6";

export type DreamLang = "en" | "he";

// ===== המסגרת הפרשנית — זה ה-DNA של המוצר. ערוך כאן בחופשיות. =====
function frameworkSystemPrompt(lang: DreamLang): string {
  const languageLine =
    lang === "en" ? "Write every text field in English." : "כתוב כל שדה טקסט בעברית.";
  return `
אתה מנתח חלומות שעובד דרך עדשה רגשית-סימבולית.
חלץ אך ורק את מה שמופיע בחלום עצמו — אל תמציא פרטים שלא נאמרו.
${languageLine}
היה מכבד וזהיר, לא קליני ולא מאבחן.
החזר את הניתוח אך ורק דרך הכלי record_dream_analysis.
`.trim();
}

// סכימת הניתוח. כל שדה כאן הוא מה שיאפשר בהמשך לזהות דפוסים חוזרים.
const analysisTool: Anthropic.Tool = {
  name: "record_dream_analysis",
  description: "תיעוד הניתוח המובנה של החלום",
  input_schema: {
    type: "object",
    properties: {
      emotions: {
        type: "array",
        description: "הרגשות המרכזיים שעולים מהחלום",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "שם הרגש" },
            intensity: {
              type: "number",
              description: "עוצמת הרגש, בין 0 (קלוש) ל-1 (חזק מאוד)",
            },
          },
          required: ["name", "intensity"],
        },
      },
      characters: {
        type: "array",
        items: { type: "string" },
        description: "דמויות ואנשים שמופיעים בחלום",
      },
      locations: {
        type: "array",
        items: { type: "string" },
        description: "מקומות וזירות בחלום",
      },
      symbols: {
        type: "array",
        items: { type: "string" },
        description: "סמלים ואובייקטים מרכזיים",
      },
      themes: {
        type: "array",
        items: { type: "string" },
        description: "תמות ודפוסים מרכזיים",
      },
    },
    required: ["emotions", "characters", "locations", "symbols", "themes"],
  },
};

export interface DreamAnalysis {
  emotions: { name: string; intensity: number }[];
  characters: string[];
  locations: string[];
  symbols: string[];
  themes: string[];
  visual_scene?: string; // English description for image generation styles that need it
  palette?: string[]; // Explicit named colors for abstract image styles — more reliable than deriving color from mood text
}

export async function analyzeDream(dreamText: string, lang: DreamLang = "he"): Promise<DreamAnalysis> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: frameworkSystemPrompt(lang),
    tools: [analysisTool],
    tool_choice: { type: "tool", name: "record_dream_analysis" },
    messages: [{ role: "user", content: `הנה החלום לניתוח:\n\n${dreamText}` }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("המודל לא החזיר ניתוח מובנה");
  }
  return toolUse.input as DreamAnalysis;
}

// ===== הרצה מהטרמינל =====
// שימוש:  npm run analyze -- "טקסט החלום שלך"
//    או:  npm run analyze -- --file dream.txt
async function main() {
  const args = process.argv.slice(2);
  let dreamText: string;

  const fileFlag = args.indexOf("--file");
  if (fileFlag !== -1 && args[fileFlag + 1]) {
    dreamText = readFileSync(args[fileFlag + 1], "utf-8");
  } else if (args[0]) {
    dreamText = args.join(" ");
  } else {
    console.error(
      'שימוש:\n  npm run analyze -- "טקסט החלום"\n  npm run analyze -- --file dream.txt'
    );
    process.exit(1);
  }

  const analysis = await analyzeDream(dreamText);
  console.log(JSON.stringify(analysis, null, 2));
}

// מריצים את main רק כשהקובץ מורץ ישירות (לא כשמייבאים את analyzeDream)
const isDirectRun = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  main().catch((err) => {
    console.error("שגיאה:", err.message);
    process.exit(1);
  });
}
