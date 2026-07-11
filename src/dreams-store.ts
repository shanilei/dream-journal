import { getSupabase } from "./supabase";

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
  };
}

export async function saveDream(entry: DreamEntry): Promise<void> {
  const { error } = await getSupabase().from("dreams").insert({
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
  });
  if (error) throw error;
}

// Only the columns every list view (Gallery, Insights, Type-filtered list)
// actually reads — dream_text/interpretation_text/image_prompt can be
// large and are only needed on a single dream's detail page (getDream
// below still selects "*" for that). Fetching them for every row in a
// list was pure wasted payload that got slower as the table grew.
const LIST_COLUMNS = "id, created_at, image_url, mood, name, summary_text, symbols, keywords";

export async function listDreams(): Promise<DreamEntry[]> {
  const { data, error } = await getSupabase()
    .from("dreams")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => fromRow(row as DreamRow));
}

export async function getDream(id: string): Promise<DreamEntry | undefined> {
  const { data, error } = await getSupabase().from("dreams").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : undefined;
}
