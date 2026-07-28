import { NextRequest, NextResponse } from "next/server";
import { getDream } from "@/dreams-store";
import { generatePrintImage } from "@/print-image";
import { getSupabaseAdmin } from "@/supabase-admin";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "node:crypto";

// generatePrintImage uses @napi-rs/canvas, which needs the Node runtime.
export const runtime = "nodejs";

// On-demand "print without the blur layer" — a separate flattened PNG
// built from the dream's clearImageUrl instead of imageUrl, generated
// only when a visitor actually asks for it (see the print modal's
// checkbox in DreamResultScreen.tsx), not persisted anywhere. The
// default print (printImageUrl on the dream row) is untouched by this —
// this route never writes to the dream, only returns a fresh URL.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // getDream already scopes by user_id — a dream owned by someone else
  // comes back as undefined here, identical to a nonexistent id.
  const dream = await getDream(id, user.id);
  if (!dream) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!dream.clearImageUrl) {
    return NextResponse.json({ error: "No clear image available for this dream" }, { status: 400 });
  }

  try {
    const clearRes = await fetch(dream.clearImageUrl);
    if (!clearRes.ok) throw new Error(`failed to fetch clear image: ${clearRes.status}`);
    const clearBuffer = Buffer.from(await clearRes.arrayBuffer());

    const printImageBuffer = await generatePrintImage({
      imageBuffer: clearBuffer,
      imageUrl: dream.clearImageUrl,
      summaryText: dream.summaryText,
      dreamText: dream.dreamText,
      createdAt: dream.createdAt,
      captionOverride: dream.captionOverride,
      showDate: dream.showDate ?? true,
      showTime: dream.showTime ?? true,
      displayAt: dream.displayAt,
      captionFontSize: dream.captionFontSize,
      metaFontSize: dream.metaFontSize,
    });

    const storagePath = `${randomUUID()}.png`;
    const { error: uploadError } = await getSupabaseAdmin()
      .storage.from("dream-images")
      .upload(storagePath, printImageBuffer, { contentType: "image/png" });
    if (uploadError) throw uploadError;
    const printImageUrl = getSupabaseAdmin().storage.from("dream-images").getPublicUrl(storagePath).data.publicUrl;

    return NextResponse.json({ printImageUrl });
  } catch (err) {
    console.error("clear print image generation failed:", err);
    return NextResponse.json({ error: "Failed to generate clear print image" }, { status: 500 });
  }
}
