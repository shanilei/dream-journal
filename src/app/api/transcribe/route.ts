import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const ai = new GoogleGenAI({}); // קורא את GEMINI_API_KEY מהסביבה
const MODEL = "gemini-2.5-flash";

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const audio = formData?.get("audio");

  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "Missing audio" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await audio.arrayBuffer());
    const mimeType = audio.type || "audio/webm";

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Transcribe this audio recording of someone describing a dream out loud. Return ONLY the spoken words as plain text — no commentary, no formatting, no quotation marks. Transcribe in whatever language the speaker is using.",
            },
            { inlineData: { mimeType, data: buffer.toString("base64") } },
          ],
        },
      ],
    });

    const text = response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!text) throw new Error("No transcript returned");

    return NextResponse.json({ text });
  } catch (err) {
    console.error("שגיאה בתמלול:", err);
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
  }
}
