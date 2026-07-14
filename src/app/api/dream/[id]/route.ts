import { NextRequest, NextResponse } from "next/server";
import { getDream } from "@/dreams-store";
import { shortSymbol } from "@/lib/dream-format";

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
