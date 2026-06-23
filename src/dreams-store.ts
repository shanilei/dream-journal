import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface DreamEntry {
  id: string;
  createdAt: string;
  imageUrl: string;
  mood: string;
  summaryText: string;
  symbols: string[];
}

const DATA_DIR = join(process.cwd(), "data");
const DATA_FILE = join(DATA_DIR, "dreams.json");

function readAll(): DreamEntry[] {
  if (!existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export function saveDream(entry: DreamEntry): void {
  mkdirSync(DATA_DIR, { recursive: true });
  const all = readAll();
  all.push(entry);
  writeFileSync(DATA_FILE, JSON.stringify(all, null, 2));
}

export function listDreams(): DreamEntry[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getDream(id: string): DreamEntry | undefined {
  return readAll().find((dream) => dream.id === id);
}
