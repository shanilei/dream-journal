import { NextRequest, NextResponse } from "next/server";
import { mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { randomUUID } from "node:crypto";
import { analyzeDream } from "@/analyze";
import { generateImage, pickProfile } from "@/generate-image";
import { saveDream } from "@/dreams-store";

export const runtime = "nodejs";

const MOOD_LABELS = { sweet: "Sweet", confused: "Confused", fear: "Fear" } as const;

function shortSymbol(symbol: string): string {
  return symbol.split(" - ")[0].trim();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const dreamText = body?.text;

  if (typeof dreamText !== "string" || !dreamText.trim()) {
    return NextResponse.json({ error: "Missing dream text" }, { status: 400 });
  }

  try {
    const analysis = await analyzeDream(dreamText);

    const outDir = join(process.cwd(), "public", "images", "generated");
    mkdirSync(outDir, { recursive: true });
    const outputPath = join(outDir, `${randomUUID()}.png`);

    const { rawPath } = await generateImage(
      analysis,
      outputPath,
      true,
      "phantom-blur",
      undefined,
      "gemini"
    );

    const finalPath = rawPath;
    const publicDir = join(process.cwd(), "public");
    const imageUrl = "/" + relative(publicDir, finalPath).split("\\").join("/");
    const mood = MOOD_LABELS[pickProfile(analysis)];
    const summaryText = analysis.themes?.length ? `${analysis.themes.slice(0, 2).join(". ")}.` : "";
    const symbols = (analysis.symbols ?? []).slice(0, 3).map(shortSymbol);

    saveDream({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      imageUrl,
      mood,
      summaryText,
      symbols,
    });

    return NextResponse.json({
      analysis,
      mood,
      imageUrl,
    });
  } catch (err) {
    console.error("שגיאה בעיבוד החלום:", err);
    return NextResponse.json({ error: "Failed to process dream" }, { status: 500 });
  }
}
