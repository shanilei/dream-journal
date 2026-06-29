import { supabase } from "./supabase";

export interface DreamEntry {
  id: string;
  createdAt: string;
  imageUrl: string;
  clearImageUrl?: string;
  mood: string;
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
  mood: string;
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
    mood: row.mood,
    summaryText: row.summary_text,
    symbols: row.symbols ?? [],
    imagePrompt: row.image_prompt ?? undefined,
    dreamText: row.dream_text ?? undefined,
    interpretationText: row.interpretation_text ?? undefined,
    keywords: row.keywords ?? [],
  };
}

export async function saveDream(entry: DreamEntry): Promise<void> {
  const { error } = await supabase.from("dreams").insert({
    id: entry.id,
    created_at: entry.createdAt,
    image_url: entry.imageUrl,
    clear_image_url: entry.clearImageUrl ?? null,
    mood: entry.mood,
    summary_text: entry.summaryText,
    symbols: entry.symbols,
    image_prompt: entry.imagePrompt ?? null,
    dream_text: entry.dreamText ?? null,
    interpretation_text: entry.interpretationText ?? null,
    keywords: entry.keywords ?? null,
  });
  if (error) throw error;
}

export async function listDreams(): Promise<DreamEntry[]> {
  const { data, error } = await supabase
    .from("dreams")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getDream(id: string): Promise<DreamEntry | undefined> {
  const { data, error } = await supabase.from("dreams").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : undefined;
}
