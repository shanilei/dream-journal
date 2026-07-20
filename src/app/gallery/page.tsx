import HomeScreenClient from "@/components/HomeScreenClient";
import { listDreams } from "@/dreams-store";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MOOD_TYPES = ["Fear", "Confused", "Sweet", "Sad", "Angry"] as const;

export default async function GalleryPage() {
  const user = await requireUser();
  const dreams = await listDreams(user.id).catch(() => []);

  const toCard = (dream: (typeof dreams)[number]) => ({
    id: dream.id,
    image: dream.imageUrl,
    mood: dream.mood,
    name: dream.name,
    createdAt: dream.createdAt,
    summary: dream.summaryText,
    symbols: dream.symbols,
    keywords: dream.keywords,
  });

  const cards = dreams.slice(0, 3).map(toCard);
  const gridCards = dreams.map(toCard);

  const categories = MOOD_TYPES.map((mood) => ({
    label: mood,
    count: dreams.filter((dream) => dream.mood === mood).length,
  }));

  return <HomeScreenClient cards={cards} gridCards={gridCards} categories={categories} />;
}
