import "dotenv/config";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "./supabase-admin";
import { pickProfile } from "./generate-image";

// This script runs standalone (via tsx, not through a Next.js request),
// so it can't use dreams-store.ts's saveDream() — that now goes through
// the request-scoped server client (src/lib/supabase/server.ts), which
// depends on next/headers's cookies() and only works inside an actual
// Next.js request. Inserting directly via the admin client here instead
// is exactly the "genuinely administrative, server-only" use that
// client is still reserved for. Note: since dreams-store.ts's reads are
// now scoped by user_id, a dream seeded here (with no owner) won't show
// up in anyone's gallery until it's explicitly assigned to an account.

const MOOD_LABELS = { sweet: "Sweet", confused: "Confused", fear: "Fear", sad: "Sad", angry: "Angry" } as const;

async function main() {
  const analysis = JSON.parse(readFileSync("analysis-mask-sea.json", "utf-8"));

  const rawImage   = readFileSync("images/mask-sea-direct.png");
  const clearImage = readFileSync("images/mask-sea-direct-clear.png");

  const rawPath = `${randomUUID()}.png`;
  const { error: e1 } = await getSupabaseAdmin().storage.from("dream-images").upload(rawPath, rawImage, { contentType: "image/png" });
  if (e1) throw e1;
  const imageUrl = getSupabaseAdmin().storage.from("dream-images").getPublicUrl(rawPath).data.publicUrl;

  const clearPath = `${randomUUID()}.png`;
  const { error: e2 } = await getSupabaseAdmin().storage.from("dream-images").upload(clearPath, clearImage, { contentType: "image/png" });
  if (e2) throw e2;
  const clearImageUrl = getSupabaseAdmin().storage.from("dream-images").getPublicUrl(clearPath).data.publicUrl;

  const mood = MOOD_LABELS[pickProfile(analysis)];
  const summaryText = (analysis.themes ?? []).slice(0, 2).join(". ") + ".";
  const symbols = (analysis.symbols ?? []).slice(0, 3).map((s: string) => s.split(" - ")[0].trim());

  const { error: insertError } = await getSupabaseAdmin().from("dreams").insert({
    id: randomUUID(),
    created_at: new Date().toISOString(),
    image_url: imageUrl,
    clear_image_url: clearImageUrl,
    mood,
    summary_text: summaryText,
    symbols,
    dream_text: "חלמתי שמישהו עומד מולי עם מסכה ואני בים",
    interpretation_text: "הים שמסביבך — נזיל, משתנה, חסר קרקע — אולי מייצג מקום שבו הדברים אינם יציבים, שבו קשה לדעת מה נכון. מול זה עומדת דמות שמסתירה את פניה. מה אם יש מישהו — או משהו — בחייך שאתה/את מרגיש/ה שאינך רואה כפי שהוא באמת? אולי יש גם תחושת בדידות בתוך העימות הזה, עמידה לבד מול הלא-נודע. שווה לשאול: מה מסתתר מאחורי המסכה, ומה היית רוצה לגלות שם?",
    keywords: ["ים", "מסכה", "אי-ודאות", "הסתרת זהות", "בדידות", "עימות עם הלא-נודע", "חוסר יציבות"],
  });
  if (insertError) throw insertError;

  console.log("✓ Dream saved. imageUrl:", imageUrl);
}

main().catch((e) => { console.error(e); process.exit(1); });
