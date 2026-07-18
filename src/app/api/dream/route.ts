import { NextRequest, NextResponse } from "next/server";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { analyzeDream } from "@/analyze";
import { interpretDream } from "@/interpret";
import { generateImage, pickProfile } from "@/generate-image";
import { saveDream } from "@/dreams-store";
import { getSupabaseAdmin } from "@/supabase-admin";
import { generatePrintImage } from "@/print-image";

export const runtime = "nodejs";

const MOOD_LABELS = { sweet: "Sweet", confused: "Confused", fear: "Fear", sad: "Sad", angry: "Angry" } as const;

function shortSymbol(symbol: string): string {
  return symbol.split(" - ")[0].trim();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const dreamText = body?.text;
  const lang = body?.lang === "en" ? "en" : "he";

  if (typeof dreamText !== "string" || !dreamText.trim()) {
    return NextResponse.json({ error: "Missing dream text" }, { status: 400 });
  }

  try {
    const analysis = await analyzeDream(dreamText, lang);
    const interpretation = await interpretDream(dreamText, analysis, lang);

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
    const { error: uploadError } = await getSupabaseAdmin().storage
      .from("dream-images")
      .upload(storagePath, imageBuffer, { contentType: "image/png", cacheControl: "31536000" });
    if (uploadError) throw uploadError;
    const { data: publicUrlData } = getSupabaseAdmin().storage.from("dream-images").getPublicUrl(storagePath);
    const imageUrl = publicUrlData.publicUrl;

    const clearStoragePath = `${randomUUID()}.png`;
    const { error: clearUploadError } = await getSupabaseAdmin().storage
      .from("dream-images")
      .upload(clearStoragePath, clearBuffer, { contentType: "image/png" });
    if (clearUploadError) throw clearUploadError;
    const { data: clearPublicUrlData } = getSupabaseAdmin().storage.from("dream-images").getPublicUrl(clearStoragePath);
    const clearImageUrl = clearPublicUrlData.publicUrl;

    const mood = MOOD_LABELS[pickProfile(analysis)];
    const summaryText = analysis.themes?.length ? `${analysis.themes.slice(0, 2).join(". ")}.` : "";
    const symbols = (analysis.symbols ?? []).slice(0, 3).map(shortSymbol);
    const dreamId = randomUUID();
    const createdAt = new Date().toISOString();

    // Flattened, fully-opaque copy of the image+scrim+caption card for
    // printing — Safari's print/PDF rasterizer has proven unreliable with
    // layered/semi-transparent DOM content, so print always uses this single
    // pre-composited PNG instead of rendering the live layout at print time.
    let printImageUrl: string | undefined;
    try {
      const printImageBuffer = await generatePrintImage({
        imageBuffer,
        imageUrl,
        summaryText,
        dreamText,
        createdAt,
      });

      // Round-trip through disk before uploading, mirroring imageBuffer/
      // clearBuffer above (readFileSync'd from a generated file) rather than
      // handing sharp's in-memory Buffer straight to the Supabase client —
      // a direct in-memory Buffer produced a corrupted upload in production
      // (every non-UTF-8 byte replaced with U+FFFD, the classic signature of
      // an accidental binary→string→binary round-trip somewhere in that
      // path). Writing/reading through fs sidesteps whatever that was.
      const printOutputPath = join(outDir, `${randomUUID()}-print.png`);
      writeFileSync(printOutputPath, printImageBuffer);
      const printImageBufferFromDisk = readFileSync(printOutputPath);
      rmSync(printOutputPath, { force: true });

      // PNG signature check — never upload a corrupted file silently again.
      const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      if (!printImageBufferFromDisk.subarray(0, 8).equals(PNG_SIGNATURE)) {
        throw new Error("generated print image failed PNG signature check — refusing to upload");
      }

      const printStoragePath = `${randomUUID()}.png`;
      const { error: printUploadError } = await getSupabaseAdmin().storage
        .from("dream-images")
        .upload(printStoragePath, printImageBufferFromDisk, { contentType: "image/png" });
      if (printUploadError) throw printUploadError;
      printImageUrl = getSupabaseAdmin().storage.from("dream-images").getPublicUrl(printStoragePath).data.publicUrl;
    } catch (printErr) {
      // Non-fatal — the dream itself is already generated; printing just
      // falls back to the live layered layout for this one entry.
      console.error("print image generation failed:", printErr);
    }

    await saveDream({
      id: dreamId,
      createdAt,
      imageUrl,
      clearImageUrl,
      printImageUrl,
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
      printImageUrl,
      interpretationText: interpretation.interpretationText,
      keywords: interpretation.keywords,
    });
  } catch (err) {
    console.error("שגיאה בעיבוד החלום:", err);
    return NextResponse.json({ error: "Failed to process dream" }, { status: 500 });
  }
}
