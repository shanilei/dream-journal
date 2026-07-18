import { NextRequest, NextResponse } from "next/server";
import { getDream, updateDream } from "@/dreams-store";
import { shortSymbol } from "@/lib/dream-format";
import { generatePrintImage } from "@/print-image";
import { getSupabase } from "@/supabase";
import { randomUUID } from "node:crypto";

// generatePrintImage uses @napi-rs/canvas, which needs the Node runtime.
export const runtime = "nodejs";

// Used by the Gallery's in-place open-transition (see
// DreamAnalysisOverlay in HomeScreenClient.tsx) to fetch a dream's full
// interpretation/dreamText/symbols client-side — the gallery grid only
// ever has the trimmed list-view columns (see LIST_COLUMNS in
// dreams-store.ts), not enough to render the real Analysis content.
// Mirrors /dream/[id]/page.tsx's symbol formatting exactly so the
// overlay's fetched content and the real route's server-rendered
// content are identical — no visible difference when the two hand off.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dream = await getDream(id);
  if (!dream) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...dream,
    symbols: dream.symbols.slice(0, 3).map(shortSymbol),
  });
}

const CAPTION_MAX_CHARS = 80;

// "Edit image details" (Dream Result screen) — overlay-only metadata edit.
// Never touches image_url/summary_text/dream_text or regenerates the AI
// artwork; only the caption/date/time drawn on top of it. When a
// printImageUrl already exists (the pre-flattened PNG used for printing),
// it's regenerated here so Print reflects the edit too — otherwise print
// falls back to the live layered layout, which already reads the same
// edited fields (see DreamResultScreen.tsx).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const dream = await getDream(id);
  if (!dream) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const captionOverride =
    typeof body.caption === "string" ? body.caption.trim().slice(0, CAPTION_MAX_CHARS) : undefined;
  const showDate = typeof body.showDate === "boolean" ? body.showDate : undefined;
  const showTime = typeof body.showTime === "boolean" ? body.showTime : undefined;
  const displayAt = typeof body.displayAt === "string" && body.displayAt ? body.displayAt : undefined;

  const effectiveCaption = captionOverride !== undefined ? captionOverride : dream.captionOverride;
  const effectiveShowDate = showDate !== undefined ? showDate : dream.showDate ?? true;
  const effectiveShowTime = showTime !== undefined ? showTime : dream.showTime ?? true;
  const effectiveDisplayAt = displayAt !== undefined ? displayAt : dream.displayAt;

  let printImageUrl: string | undefined;
  if (dream.printImageUrl) {
    try {
      const imageRes = await fetch(dream.imageUrl);
      if (!imageRes.ok) throw new Error(`failed to fetch source image: ${imageRes.status}`);
      const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

      const printImageBuffer = await generatePrintImage({
        imageBuffer,
        imageUrl: dream.imageUrl,
        summaryText: dream.summaryText,
        dreamText: dream.dreamText,
        createdAt: dream.createdAt,
        captionOverride: effectiveCaption,
        showDate: effectiveShowDate,
        showTime: effectiveShowTime,
        displayAt: effectiveDisplayAt,
      });

      const printStoragePath = `${randomUUID()}.png`;
      const { error: uploadError } = await getSupabase()
        .storage.from("dream-images")
        .upload(printStoragePath, printImageBuffer, { contentType: "image/png" });
      if (uploadError) throw uploadError;
      printImageUrl = getSupabase().storage.from("dream-images").getPublicUrl(printStoragePath).data.publicUrl;
    } catch (err) {
      // Non-fatal — the caption/date/time edit itself still saves; only the
      // flattened print PNG fails to refresh, in which case print keeps
      // showing the previous (now slightly stale) version until the next
      // successful edit regenerates it.
      console.error("print image regeneration failed:", err);
    }
  }

  await updateDream(id, {
    ...(captionOverride !== undefined ? { captionOverride } : {}),
    ...(showDate !== undefined ? { showDate } : {}),
    ...(showTime !== undefined ? { showTime } : {}),
    ...(displayAt !== undefined ? { displayAt } : {}),
    ...(printImageUrl !== undefined ? { printImageUrl } : {}),
  });

  const updated = await getDream(id);
  return NextResponse.json({
    ...updated,
    symbols: updated?.symbols.slice(0, 3).map(shortSymbol) ?? [],
  });
}
