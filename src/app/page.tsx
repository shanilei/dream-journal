import HomeScreenClient from "@/components/HomeScreenClient";
import { listDreams } from "@/dreams-store";

const MOOD_TYPES = ["Fear", "Confused", "Sweet"] as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default async function HomePage() {
  const dreams = await listDreams();

  const cards = dreams.slice(0, 3).map((dream) => ({
    id: dream.id,
    image: dream.imageUrl,
    mood: dream.mood,
    date: formatDate(dream.createdAt),
    time: formatTime(dream.createdAt),
  }));

  const categories = MOOD_TYPES.map((mood) => ({
    label: mood,
    count: dreams.filter((dream) => dream.mood === mood).length,
  }));

  return <HomeScreenClient cards={cards} categories={categories} />;
}
