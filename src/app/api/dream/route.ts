import { NextRequest, NextResponse } from "next/server";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { analyzeDream } from "@/analyze";
import { interpretDream } from "@/interpret";
import { generateImage, pickProfile } from "@/generate-image";
import { saveDream } from "@/dreams-store";
import { getSupabase } from "@/supabase";

export const runtime = "nodejs";

const MOOD_LABELS = { sweet: "Sweet", confused: "Confused", fear: "Fear", sad: "Sad", angry: "Angry" } as const;

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
    const interpretation = await interpretDream(dreamText, analysis);

    const outDir = join(process.env.TMPDIR ?? "/tmp", "dream-journal");
    mkdirSync(outDir, { recursive: true });
    const outputPath = join(outDir, `${randomUUID()}.png`);

    const { rawPath, clearPath, prompt } = await generateImage(
      analysis,
      outputPath,
      "surreal-minimalist",
      undefined,
      "gemini"
    );

    const imageBuffer = readFileSync(rawPath);
    const clearBuffer = readFileSync(clearPath);
    rmSync(rawPath, { force: true });
    rmSync(clearPath, { force: true });

    const storagePath = `${randomUUID()}.png`;
    const { error: uploadError } = await getSupabase().storage
      .from("dream-images")
      .upload(storagePath, imageBuffer, { contentType: "image/png" });
    if (uploadError) throw uploadError;
    const { data: publicUrlData } = getSupabase().storage.from("dream-images").getPublicUrl(storagePath);
    const imageUrl = publicUrlData.publicUrl;

    const clearStoragePath = `${randomUUID()}.png`;
    const { error: clearUploadError } = await getSupabase().storage
      .from("dream-images")
      .upload(clearStoragePath, clearBuffer, { contentType: "image/png" });
    if (clearUploadError) throw clearUploadError;
    const { data: clearPublicUrlData } = getSupabase().storage.from("dream-images").getPublicUrl(clearStoragePath);
    const clearImageUrl = clearPublicUrlData.publicUrl;

    const mood = MOOD_LABELS[pickProfile(analysis)];
    const summaryText = interpretation.description || (analysis.themes?.length ? `${analysis.themes.slice(0, 2).join(". ")}.` : "");
    const symbols = (analysis.symbols ?? []).slice(0, 3).map(shortSymbol);
    const dreamId = randomUUID();

    await saveDream({
      id: dreamId,
      createdAt: new Date().toISOString(),
      imageUrl,
      clearImageUrl,
      mood,
      name: interpretation.name,
      summaryText,
      symbols,
      imagePrompt: prompt,
      dreamText,
      interpretationText: interpretation.interpretationText,
      keywords: interpretation.keywords,
    });

    return NextResponse.json({
      id: dreamId,
      name: interpretation.name,
      analysis,
      mood,
      imageUrl,
      clearImageUrl,
      summaryText,
      interpretationText: interpretation.interpretationText,
      keywords: interpretation.keywords,
    });
  } catch (err) {
    console.error("שגיאה בעיבוד החלום:", err);
    return NextResponse.json({ error: "Failed to process dream" }, { status: 500 });
  }
}
