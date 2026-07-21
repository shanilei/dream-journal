import { createClient } from "./lib/supabase/server";
import { effectiveDreamDate } from "./lib/dreamDate";

export interface DreamEntry {
  id: string;
  createdAt: string;
  imageUrl: string;
  clearImageUrl?: string;
  printImageUrl?: string;
  mood: string;
  name?: string;
  summaryText: string;
  symbols: string[];
  imagePrompt?: string;
  dreamText?: string;
  interpretationText?: string;
  keywords?: string[];
  // Overlay-only edits (see "Edit image details" on the Dream Result
  // screen) — these never touch the generated artwork itself, only what's
  // drawn on top of it. displayAt, when set, is also the dream's date of
  // record everywhere else (gallery grouping/sort, calendar, insights,
  // print) — see effectiveDreamDate() in lib/dreamDate.ts.
  captionOverride?: string;
  showDate?: boolean;
  showTime?: boolean;
  displayAt?: string;
  // Font sizes for the caption / date+time text drawn on the image (see
  // "Edit image details"), in on-screen CSS px — undefined means "use the
  // app's own default" (CAPTION_FONT_SIZE_DEFAULT/META_FONT_SIZE_DEFAULT
  // in lib/caption.ts), not 0/null.
  captionFontSize?: number;
  metaFontSize?: number;
}

interface DreamRow {
  id: string;
  created_at: string;
  image_url: string;
  clear_image_url: string | null;
  print_image_url: string | null;
  mood: string;
  name: string | null;
  summary_text: string;
  symbols: string[];
  image_prompt: string | null;
  dream_text: string | null;
  interpretation_text: string | null;
  keywords: string[] | null;
  caption_override: string | null;
  show_date: boolean | null;
  show_time: boolean | null;
  display_at: string | null;
  caption_font_size: number | null;
  meta_font_size: number | null;
}

function fromRow(row: DreamRow): DreamEntry {
  return {
    id: row.id,
    createdAt: row.created_at,
    imageUrl: row.image_url,
    clearImageUrl: row.clear_image_url ?? undefined,
    printImageUrl: row.print_image_url ?? undefined,
    mood: row.mood,
    name: row.name ?? undefined,
    summaryText: row.summary_text,
    symbols: row.symbols ?? [],
    imagePrompt: row.image_prompt ?? undefined,
    dreamText: row.dream_text ?? undefined,
    interpretationText: row.interpretation_text ?? undefined,
    keywords: row.keywords ?? [],
    captionOverride: row.caption_override ?? undefined,
    showDate: row.show_date ?? true,
    showTime: row.show_time ?? true,
    displayAt: row.display_at ?? undefined,
    captionFontSize: row.caption_font_size ?? undefined,
    metaFontSize: row.meta_font_size ?? undefined,
  };
}

// Every function below uses the request-scoped server client (anon key +
// the caller's own session cookies), never the admin/service-role client
// — see src/supabase-admin.ts, which is now reserved for genuinely
// admin-only work. RLS isn't enabled yet (a later phase), so the
// `.eq("user_id", userId)` filter on every query below is currently the
// *only* thing enforcing "you only see your own dreams" — it's not just
// a performance/convenience filter, it's the actual ownership boundary
// until RLS lands as defense-in-depth on top of it.

export async function saveDream(entry: DreamEntry & { userId: string }): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("dreams").insert({
    id: entry.id,
    created_at: entry.createdAt,
    image_url: entry.imageUrl,
    clear_image_url: entry.clearImageUrl ?? null,
    print_image_url: entry.printImageUrl ?? null,
    mood: entry.mood,
    name: entry.name ?? null,
    summary_text: entry.summaryText,
    symbols: entry.symbols,
    image_prompt: entry.imagePrompt ?? null,
    dream_text: entry.dreamText ?? null,
    interpretation_text: entry.interpretationText ?? null,
    keywords: entry.keywords ?? null,
    caption_override: entry.captionOverride ?? null,
    show_date: entry.showDate ?? true,
    show_time: entry.showTime ?? true,
    display_at: entry.displayAt ?? null,
    caption_font_size: entry.captionFontSize ?? null,
    meta_font_size: entry.metaFontSize ?? null,
    user_id: entry.userId,
  });
  if (error) throw error;
}

// Overlay-only edits (see "Edit image details") — never touches image_url,
// summary_text, or any other artwork/analysis field, only the caption/
// date/time metadata drawn on top of the image.
export interface DreamOverlayPatch {
  captionOverride?: string | null;
  showDate?: boolean;
  showTime?: boolean;
  displayAt?: string | null;
  captionFontSize?: number | null;
  metaFontSize?: number | null;
  printImageUrl?: string;
}

export async function updateDream(id: string, patch: DreamOverlayPatch, userId: string): Promise<void> {
  const update: Record<string, unknown> = {};
  if ("captionOverride" in patch) update.caption_override = patch.captionOverride ?? null;
  if ("showDate" in patch) update.show_date = patch.showDate;
  if ("showTime" in patch) update.show_time = patch.showTime;
  if ("displayAt" in patch) update.display_at = patch.displayAt ?? null;
  if ("captionFontSize" in patch) update.caption_font_size = patch.captionFontSize ?? null;
  if ("metaFontSize" in patch) update.meta_font_size = patch.metaFontSize ?? null;
  if ("printImageUrl" in patch) update.print_image_url = patch.printImageUrl;

  const supabase = await createClient();
  // Scoped by both id AND user_id — a signed-in user can't update a
  // dream that isn't theirs by guessing its id (the WHERE clause simply
  // matches zero rows for anyone else's dream, so this silently no-ops
  // rather than erroring — the caller's own getDream(id, userId) call
  // beforehand is what actually surfaces a 404 for that case).
  const { error } = await supabase.from("dreams").update(update).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

// Only the columns every list view (Gallery, Insights, Type-filtered list)
// actually reads — dream_text/interpretation_text/image_prompt can be
// large and are only needed on a single dream's detail page (getDream
// below still selects "*" for that). Fetching them for every row in a
// list was pure wasted payload that got slower as the table grew.
const LIST_COLUMNS = "id, created_at, display_at, image_url, mood, name, summary_text, symbols, keywords";

export async function listDreams(userId: string): Promise<DreamEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dreams")
    .select(LIST_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const dreams = (data ?? []).map((row) => fromRow(row as DreamRow));
  // Re-sort by the *effective* date (display_at when set, else created_at)
  // — the DB-level order above is just a reasonable initial fetch order;
  // an edited display date can move a dream earlier/later than its actual
  // insertion order, and every list view (gallery, type filter, insights)
  // needs that same order to agree.
  dreams.sort((a, b) => (effectiveDreamDate(a) < effectiveDreamDate(b) ? 1 : -1));
  return dreams;
}

export async function getDream(id: string, userId: string): Promise<DreamEntry | undefined> {
  const supabase = await createClient();
  // Matching on id AND user_id together (not id alone, then checking
  // ownership after) means a dream belonging to someone else simply
  // doesn't match the query at all — it comes back exactly the same as
  // "id doesn't exist", so callers can't distinguish "not yours" from
  // "never existed" and every call site already treats undefined as a
  // plain 404/notFound(), with no separate "unauthorized" branch to leak
  // that distinction through.
  const { data, error } = await supabase
    .from("dreams")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : undefined;
}
