import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import { analyzeDream, type DreamAnalysis } from "./analyze";

const client = new Anthropic(); // קורא את ANTHROPIC_API_KEY מהסביבה

const MODEL = "claude-sonnet-4-6";

// ===== שלב 2: פרשנות כתובה — ראה כללי הברזל ב-CLAUDE.md =====
const INTERPRETATION_SYSTEM_PROMPT = `
אתה כותב פרשנות לחלום, בהתבסס על ניתוח מובנה שבוצע עליו מראש.
התבסס אך ורק על מה שמופיע בניתוח ובחלום עצמו — אל תמציא פרטים שלא נאמרו.
נסח את הפרשנות כהזמנה לרפלקציה, לא כאבחנה: השתמש בניסוחים כמו "אולי", "יכול להיות ש...", "מה אם" — ולא בקביעות מוחלטות.
היה מכבד וזהיר, לא קליני ולא פסיכואנליטי. כתוב 2-4 משפטים, לא יותר.
כתוב בשפה שבה נכתב החלום.
החזר את הפרשנות אך ורק דרך הכלי record_dream_interpretation.
`.trim();

const interpretationTool: Anthropic.Tool = {
  name: "record_dream_interpretation",
  description: "תיעוד הפרשנות הכתובה לחלום",
  input_schema: {
    type: "object",
    properties: {
      interpretationText: {
        type: "string",
        description: "פרשנות כתובה, 2-4 משפטים, מנוסחת כהזמנה לרפלקציה ולא כאבחנה",
      },
      keywords: {
        type: "array",
        items: { type: "string" },
        description: "מילות המפתח שהפרשנות מתמקדת בהן, לזיהוי דפוסים חוזרים בעתיד",
      },
    },
    required: ["interpretationText", "keywords"],
  },
};

export interface DreamInterpretation {
  interpretationText: string;
  keywords: string[];
}

export async function interpretDream(
  dreamText: string,
  analysis: DreamAnalysis
): Promise<DreamInterpretation> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: INTERPRETATION_SYSTEM_PROMPT,
    tools: [interpretationTool],
    tool_choice: { type: "tool", name: "record_dream_interpretation" },
    messages: [
      {
        role: "user",
        content: `החלום:\n${dreamText}\n\nהניתוח המובנה שבוצע עליו:\n${JSON.stringify(analysis, null, 2)}`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("המודל לא החזיר פרשנות מובנית");
  }
  return toolUse.input as DreamInterpretation;
}

// ===== הרצה מהטרמינל — בודק את שלב 1 ושלב 2 ברצף =====
// שימוש:  npm run interpret -- "טקסט החלום שלך"
//    או:  npm run interpret -- --file dream.txt
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
      'שימוש:\n  npm run interpret -- "טקסט החלום"\n  npm run interpret -- --file dream.txt'
    );
    process.exit(1);
  }

  const analysis = await analyzeDream(dreamText);
  const interpretation = await interpretDream(dreamText, analysis);
  console.log(JSON.stringify({ analysis, interpretation }, null, 2));
}

const isDirectRun = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  main().catch((err) => {
    console.error("שגיאה:", err.message);
    process.exit(1);
  });
}
