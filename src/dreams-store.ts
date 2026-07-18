import { getSupabaseAdmin } from "./supabase-admin";

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
  // drawn on top of it (and, for captionOverride/displayAt, only the
  // caption/date/time shown — createdAt keeps controlling gallery order).
  captionOverride?: string;
  showDate?: boolean;
  showTime?: boolean;
  displayAt?: string;
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
  };
}

export async function saveDream(entry: DreamEntry): Promise<void> {
  const { error } = await getSupabaseAdmin().from("dreams").insert({
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
  printImageUrl?: string;
}

export async function updateDream(id: string, patch: DreamOverlayPatch): Promise<void> {
  const update: Record<string, unknown> = {};
  if ("captionOverride" in patch) update.caption_override = patch.captionOverride ?? null;
  if ("showDate" in patch) update.show_date = patch.showDate;
  if ("showTime" in patch) update.show_time = patch.showTime;
  if ("displayAt" in patch) update.display_at = patch.displayAt ?? null;
  if ("printImageUrl" in patch) update.print_image_url = patch.printImageUrl;

  const { error } = await getSupabaseAdmin().from("dreams").update(update).eq("id", id);
  if (error) throw error;
}

// Only the columns every list view (Gallery, Insights, Type-filtered list)
// actually reads — dream_text/interpretation_text/image_prompt can be
// large and are only needed on a single dream's detail page (getDream
// below still selects "*" for that). Fetching them for every row in a
// list was pure wasted payload that got slower as the table grew.
const LIST_COLUMNS = "id, created_at, image_url, mood, name, summary_text, symbols, keywords";

export async function listDreams(): Promise<DreamEntry[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("dreams")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => fromRow(row as DreamRow));
}

export async function getDream(id: string): Promise<DreamEntry | undefined> {
  const { data, error } = await getSupabaseAdmin().from("dreams").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : undefined;
}
