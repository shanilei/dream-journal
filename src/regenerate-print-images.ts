import "dotenv/config";
import { getSupabaseAdmin } from "./supabase-admin";
import { generatePrintImage } from "./print-image";
import { randomUUID } from "node:crypto";

// One-time backfill: any dream that already has a print_image_url was
// flattened by a version of generatePrintImage() from before the Hebrew
// caption-overflow/RTL fix (see print-image.ts's CAPTION_MAX_WIDTH,
// wrapLinesToWidth, and the isHebrew-detection-source fix) — that PNG is
// stored as-is and only ever regenerated when a user explicitly re-saves
// that dream's "Edit image details" sheet. This script re-runs the fixed
// generatePrintImage() for every dream that already has a print image, so
// existing dreams get the fix without waiting for a manual per-dream edit.
//
// Safety:
// - Defaults to a dry run (report only, zero writes/uploads) — pass
//   --execute to actually regenerate and save.
// - Every dream is handled independently; one failure is logged and
//   skipped, never aborts the batch.
// - Never touches image_url/summary_text/dream_text/symbols or anything
//   else about the dream — only print_image_url, via the exact same
//   updateDream()-shaped patch the "Edit image details" PATCH route uses.
// - --limit=N caps how many dreams are processed, for a small test batch
//   before running the full set.
// - Old print images are left orphaned in storage rather than deleted —
//   regenerating just overwrites print_image_url to point at a new
//   upload, nothing destructive.
//
// Usage:
//   npx tsx src/regenerate-print-images.ts                 # dry run, all dreams
//   npx tsx src/regenerate-print-images.ts --limit=5        # dry run, first 5
//   npx tsx src/regenerate-print-images.ts --execute --limit=5   # real run, first 5
//   npx tsx src/regenerate-print-images.ts --execute         # real run, everything

interface DreamRow {
  id: string;
  user_id: string;
  created_at: string;
  image_url: string;
  print_image_url: string | null;
  summary_text: string;
  dream_text: string | null;
  mood: string;
  caption_override: string | null;
  show_date: boolean | null;
  show_time: boolean | null;
  display_at: string | null;
  caption_font_size: number | null;
  meta_font_size: number | null;
}

const PAGE_SIZE = 500;

function isHebrewText(text: string): boolean {
  return /[֐-׿]/.test(text);
}

async function fetchAllDreamsWithPrintImage(): Promise<DreamRow[]> {
  const admin = getSupabaseAdmin();
  const rows: DreamRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await admin
      .from("dreams")
      .select(
        "id, user_id, created_at, image_url, print_image_url, summary_text, dream_text, mood, caption_override, show_date, show_time, display_at, caption_font_size, meta_font_size"
      )
      .not("print_image_url", "is", null)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...(data as DreamRow[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

async function regenerateOne(row: DreamRow): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const admin = getSupabaseAdmin();
    const imageRes = await fetch(row.image_url);
    if (!imageRes.ok) throw new Error(`source image fetch failed: ${imageRes.status}`);
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    const printImageBuffer = await generatePrintImage({
      imageBuffer,
      imageUrl: row.image_url,
      summaryText: row.summary_text,
      dreamText: row.dream_text ?? undefined,
      createdAt: row.created_at,
      captionOverride: row.caption_override ?? undefined,
      showDate: row.show_date ?? true,
      showTime: row.show_time ?? true,
      displayAt: row.display_at ?? undefined,
      captionFontSize: row.caption_font_size ?? undefined,
      metaFontSize: row.meta_font_size ?? undefined,
    });

    const printStoragePath = `${randomUUID()}.png`;
    const { error: uploadError } = await admin.storage
      .from("dream-images")
      .upload(printStoragePath, printImageBuffer, { contentType: "image/png" });
    if (uploadError) throw uploadError;
    const printImageUrl = admin.storage.from("dream-images").getPublicUrl(printStoragePath).data.publicUrl;

    const { error: updateError } = await admin
      .from("dreams")
      .update({ print_image_url: printImageUrl })
      .eq("id", row.id);
    if (updateError) throw updateError;

    return { ok: true, url: printImageUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes("--execute");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;

  console.log(`Mode: ${execute ? "EXECUTE (will write to production)" : "DRY RUN (read-only, no writes)"}`);
  if (limit) console.log(`Limit: first ${limit} dreams`);

  let rows = await fetchAllDreamsWithPrintImage();
  console.log(`Found ${rows.length} dream(s) with an existing print_image_url.`);
  if (limit) rows = rows.slice(0, limit);

  const hebrewCount = rows.filter((r) => isHebrewText(r.caption_override || r.summary_text || r.dream_text || "")).length;
  console.log(`  Hebrew: ${hebrewCount}, English/other: ${rows.length - hebrewCount}`);

  if (!execute) {
    console.log("\n--- DRY RUN REPORT (no changes made) ---");
    for (const r of rows) {
      const lang = isHebrewText(r.caption_override || r.summary_text || r.dream_text || "") ? "he" : "en";
      console.log(`  ${r.id}  user=${r.user_id}  lang=${lang}  mood=${r.mood}  created=${r.created_at}`);
    }
    console.log(`\n${rows.length} dream(s) would be regenerated. Re-run with --execute to actually do it.`);
    return;
  }

  console.log("\n--- EXECUTING ---");
  let okCount = 0;
  const failures: { id: string; error: string }[] = [];
  for (const [i, row] of rows.entries()) {
    process.stdout.write(`[${i + 1}/${rows.length}] ${row.id}... `);
    const result = await regenerateOne(row);
    if (result.ok) {
      okCount++;
      console.log("ok");
    } else {
      failures.push({ id: row.id, error: result.error });
      console.log(`FAILED: ${result.error}`);
    }
  }

  console.log(`\n--- SUMMARY ---`);
  console.log(`Succeeded: ${okCount}/${rows.length}`);
  if (failures.length > 0) {
    console.log(`Failed: ${failures.length}`);
    for (const f of failures) console.log(`  ${f.id}: ${f.error}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
