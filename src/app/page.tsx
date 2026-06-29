import HomeScreenClient from "@/components/HomeScreenClient";
import { listDreams } from "@/dreams-store";

const MOOD_TYPES = ["Fear", "Confused", "Sweet"] as const;

export default async function HomePage() {
  const dreams = await listDreams();

  const cards = dreams.slice(0, 3).map((dream) => ({
    id: dream.id,
    image: dream.imageUrl,
    mood: dream.mood,
    createdAt: dream.createdAt,
    summary: dream.summaryText,
  }));

  const categories = MOOD_TYPES.map((mood) => ({
    label: mood,
    count: dreams.filter((dream) => dream.mood === mood).length,
  }));

  return <HomeScreenClient cards={cards} categories={categories} />;
}
