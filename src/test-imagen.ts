import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { writeFileSync } from "node:fs";

const ai = new GoogleGenAI({});

async function main() {
  const prompt = process.argv[2] ?? "Abstract layered painterly artwork, no figures, no objects, deep teal and warm amber colliding through translucent layers";

  const response = await ai.models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: "3:4",
    },
  });

  const img = response.generatedImages?.[0]?.image;
  if (!img?.imageBytes) {
    console.error("לא חזרה תמונה. תגובה מלאה:", JSON.stringify(response, null, 2));
    process.exit(1);
  }

  writeFileSync("images/imagen-test.png", Buffer.from(img.imageBytes, "base64"));
  console.log("נשמר: images/imagen-test.png");
}

main().catch((err) => {
  console.error("שגיאה:", err.message);
  process.exit(1);
});
