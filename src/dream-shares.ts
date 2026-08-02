import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "./supabase-admin";

const SHARE_TTL_MS = 24 * 60 * 60 * 1000;

// Public-safe subset only — no user_id, no email, nothing that would let
// a scan of one dream reach any other dream or the owner's identity.
export interface SharedDream {
  imageUrl: string;
  mood: string;
  name?: string;
  createdAt: string;
  displayAt?: string;
  summaryText: string;
  interpretationText?: string;
}

interface DreamShareRow {
  dream_id: string;
  expires_at: string;
}

interface SharedDreamRow {
  image_url: string;
  mood: string;
  name: string | null;
  created_at: string;
  display_at: string | null;
  summary_text: string;
  interpretation_text: string | null;
}

// base64url, not the raw dream id — 20 random bytes is 160 bits of
// entropy, non-guessable regardless of how many tokens already exist.
function generateToken(): string {
  return randomBytes(20).toString("base64url");
}

// Reuses an existing, still-live share for this dream instead of piling
// up a new token every time "Scan to keep your dream" is tapped again
// for the same dream (e.g. the visitor backs out and reopens it) — only
// ever creates a new row once the previous one has actually expired.
export async function createOrReuseShare(dreamId: string): Promise<{ token: string; expiresAt: string }> {
  const admin = getSupabaseAdmin();

  const { data: existing } = await admin
    .from("dream_shares")
    .select("token, expires_at")
    .eq("dream_id", dreamId)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { token: existing.token as string, expiresAt: existing.expires_at as string };
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SHARE_TTL_MS).toISOString();
  const { error } = await admin.from("dream_shares").insert({ token, dream_id: dreamId, expires_at: expiresAt });
  if (error) throw error;

  return { token, expiresAt };
}

const SHARED_DREAM_COLUMNS = "image_url, mood, name, created_at, display_at, summary_text, interpretation_text";

// Looks up a dream by share token only — never by id, never scoped to a
// user. Returns undefined for a missing *or* expired token; callers
// can't distinguish the two, matching getDream()'s own "not yours reads
// the same as never existed" precedent.
export async function getSharedDream(token: string): Promise<SharedDream | undefined> {
  const admin = getSupabaseAdmin();

  const { data: share } = await admin
    .from("dream_shares")
    .select("dream_id, expires_at")
    .eq("token", token)
    .maybeSingle<DreamShareRow>();
  if (!share) return undefined;
  if (new Date(share.expires_at).getTime() <= Date.now()) return undefined;

  const { data: dream } = await admin
    .from("dreams")
    .select(SHARED_DREAM_COLUMNS)
    .eq("id", share.dream_id)
    .maybeSingle<SharedDreamRow>();
  if (!dream) return undefined;

  return {
    imageUrl: dream.image_url,
    mood: dream.mood,
    name: dream.name ?? undefined,
    createdAt: dream.created_at,
    displayAt: dream.display_at ?? undefined,
    summaryText: dream.summary_text,
    interpretationText: dream.interpretation_text ?? undefined,
  };
}
