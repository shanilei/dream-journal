import { NextRequest, NextResponse } from "next/server";
import { getDream } from "@/dreams-store";
import { createOrReuseShare } from "@/dream-shares";
import { getCurrentUser } from "@/lib/auth";

// Exhibition Mode's "Scan to keep your dream" — creates (or reuses) a
// public, expiring, token-addressed share for one dream. Still requires
// the *owner* to be signed in to request one; the resulting link itself
// is what's public, not this endpoint.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // getDream scopes by user_id — a dream owned by someone else comes
  // back as undefined here, same as a nonexistent id (see its own
  // comment in dreams-store.ts).
  const dream = await getDream(id, user.id);
  if (!dream) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const { token, expiresAt } = await createOrReuseShare(id);
    const url = new URL(`/s/${token}`, req.nextUrl.origin).toString();
    return NextResponse.json({ url, expiresAt });
  } catch (err) {
    console.error("dream share creation failed:", err);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}
