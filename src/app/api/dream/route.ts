import { NextRequest, NextResponse, after } from "next/server";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { analyzeDream } from "@/analyze";
import { interpretDream } from "@/interpret";
import { generateImage, pickProfile } from "@/generate-image";
import { saveDream, updateDream } from "@/dreams-store";
import { getSupabaseAdmin } from "@/supabase-admin";
import { generatePrintImage } from "@/print-image";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
// This route runs Claude + Gemini + two Supabase uploads before responding
// — 60s is Vercel's own cap on the Hobby plan (and comfortably under Pro/
// Enterprise's higher ceilings too), giving real headroom over a slow
// Gemini response instead of risking a platform-level kill mid-request
// with no graceful error possible. Doesn't change the pipeline itself.
export const maxDuration = 60;

const MOOD_LABELS = { sweet: "Sweet", confused: "Confused", fear: "Fear", sad: "Sad", angry: "Angry" } as const;

function shortSymbol(symbol: string): string {
  return symbol.split(" - ")[0].trim();
}

export async function POST(req: NextRequest) {
  // Resolved server-side via the session cookie, never from the request
  // body — the client has no way to claim a user_id for itself. Checked
  // before any of the (expensive) analysis/image-generation work below,
  // so an unauthenticated request fails fast instead of doing real work
  // for a dream that couldn't be saved anyway.
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const dreamText = body?.text;
  const lang = body?.lang === "en" ? "en" : "he";

  if (typeof dreamText !== "string" || !dreamText.trim()) {
    return NextResponse.json({ error: "Missing dream text" }, { status: 400 });
  }

  const t0 = Date.now();
  const lap = (label: string, from: number) => {
    console.log(`[dream] ${label}: ${Date.now() - from}ms`);
    return Date.now();
  };

  try {
    const analysis = await analyzeDream(dreamText, lang);
    let t = lap("analyze", t0);

    const outDir = join(process.env.TMPDIR ?? "/tmp", "dream-journal");
    mkdirSync(outDir, { recursive: true });
    const outputPath = join(outDir, `${randomUUID()}.png`);

    // interpretDream and generateImage both only depend on `analysis`, not
    // on each other's output — they were previously awaited one after the
    // other for no reason. Running them together saves the full duration
    // of whichever finishes first (in practice the image generation call,
    // the slowest single step in this route).
    const [interpretation, imageResult] = await Promise.all([
      interpretDream(dreamText, analysis, lang),
      generateImage(analysis, outputPath, "surreal-minimalist", undefined, "gemini"),
    ]);
    const { rawPath, clearPath, prompt } = imageResult;
    t = lap("interpret + generate-image (parallel)", t);

    const imageBuffer = readFileSync(rawPath);
    const clearBuffer = readFileSync(clearPath);
    rmSync(rawPath, { force: true });
    rmSync(clearPath, { force: true });

    // Raw + clear image uploads write to different storage paths from
    // different buffers — independent, so they run concurrently instead
    // of one blocking the other.
    const storagePath = `${randomUUID()}.png`;
    const clearStoragePath = `${randomUUID()}.png`;
    const [{ error: uploadError }, { error: clearUploadError }] = await Promise.all([
      getSupabaseAdmin()
        .storage.from("dream-images")
        .upload(storagePath, imageBuffer, { contentType: "image/png", cacheControl: "31536000" }),
      getSupabaseAdmin()
        .storage.from("dream-images")
        .upload(clearStoragePath, clearBuffer, { contentType: "image/png" }),
    ]);
    if (uploadError) throw uploadError;
    if (clearUploadError) throw clearUploadError;
    const imageUrl = getSupabaseAdmin().storage.from("dream-images").getPublicUrl(storagePath).data.publicUrl;
    const clearImageUrl = getSupabaseAdmin().storage.from("dream-images").getPublicUrl(clearStoragePath).data.publicUrl;
    t = lap("upload raw + clear images (parallel)", t);

    const mood = MOOD_LABELS[pickProfile(analysis)];
    const summaryText = analysis.themes?.length ? `${analysis.themes.slice(0, 2).join(". ")}.` : "";
    const symbols = (analysis.symbols ?? []).slice(0, 3).map(shortSymbol);
    const dreamId = randomUUID();
    const createdAt = new Date().toISOString();

    await saveDream({
      id: dreamId,
      createdAt,
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
      userId: user.id,
    });
    lap("save dream", t);
    console.log(`[dream] total (before response): ${Date.now() - t0}ms`);

    // The flattened print PNG is never needed for the result the client is
    // about to see — it's only read later if/when the user taps Print (see
    // print-image.ts's caller). Generating + uploading it here was adding
    // its own full duration (Gemini/canvas compositing + a storage upload)
    // to the response the user is actively waiting on for no benefit, so it
    // now runs after the response has already been sent (via Next's
    // `after()`, which keeps the function alive for this instead of firing
    // a bare unawaited promise that the platform could kill mid-flight),
    // then patches print_image_url onto the already-saved row.
    after(async () => {
      const printT0 = Date.now();
      try {
        const printImageBuffer = await generatePrintImage({
          imageBuffer,
          imageUrl,
          summaryText,
          dreamText,
          createdAt,
        });

        // Round-trip through disk before uploading, mirroring imageBuffer/
        // clearBuffer above (readFileSync'd from a generated file) rather
        // than handing sharp's in-memory Buffer straight to the Supabase
        // client — a direct in-memory Buffer produced a corrupted upload in
        // production (every non-UTF-8 byte replaced with U+FFFD, the
        // classic signature of an accidental binary→string→binary
        // round-trip somewhere in that path). Writing/reading through fs
        // sidesteps whatever that was.
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
        const { error: printUploadError } = await getSupabaseAdmin()
          .storage.from("dream-images")
          .upload(printStoragePath, printImageBufferFromDisk, { contentType: "image/png" });
        if (printUploadError) throw printUploadError;
        const printImageUrl = getSupabaseAdmin().storage.from("dream-images").getPublicUrl(printStoragePath).data.publicUrl;

        await updateDream(dreamId, { printImageUrl }, user.id);
        console.log(`[dream] background print image: ${Date.now() - printT0}ms`);
      } catch (printErr) {
        // Non-fatal — the dream itself is already generated and saved;
        // printing just falls back to the live layered layout until a
        // future edit successfully regenerates print_image_url (see
        // PATCH /api/dream/[id]).
        console.error("print image generation failed:", printErr);
      }
    });

    return NextResponse.json({
      id: dreamId,
      name: interpretation.name,
      analysis,
      mood,
      imageUrl,
      clearImageUrl,
      interpretationText: interpretation.interpretationText,
      keywords: interpretation.keywords,
    });
  } catch (err) {
    console.error("שגיאה בעיבוד החלום:", err);
    return NextResponse.json({ error: "Failed to process dream" }, { status: 500 });
  }
}
