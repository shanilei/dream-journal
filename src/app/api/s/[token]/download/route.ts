import { NextRequest, NextResponse } from "next/server";
import { getSharedDream } from "@/dream-shares";

// Proxies the image through this route (rather than a plain
// `<a href={imageUrl} download>` straight to Supabase storage) because
// the `download` attribute is silently ignored by browsers for
// cross-origin resources — Supabase's storage URL is a different origin
// from this app, so without this, tapping "Save image" would just
// navigate to/preview the image instead of downloading it. Re-validates
// the token/expiry itself rather than trusting a URL a caller could
// otherwise keep using past expiry.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dream = await getSharedDream(token);
  if (!dream) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const imageRes = await fetch(dream.imageUrl);
  if (!imageRes.ok || !imageRes.body) {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }

  return new NextResponse(imageRes.body, {
    headers: {
      "Content-Type": imageRes.headers.get("content-type") ?? "image/png",
      "Content-Disposition": 'attachment; filename="dream.png"',
      "Cache-Control": "private, no-store",
    },
  });
}
