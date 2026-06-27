import HomeScreenClient from "@/components/HomeScreenClient";
import { listDreams } from "@/dreams-store";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default async function HomePage() {
  const cards = (await listDreams())
    .slice(0, 3)
    .map((dream) => ({
      id: dream.id,
      image: dream.imageUrl,
      mood: dream.mood,
      date: formatDate(dream.createdAt),
      time: formatTime(dream.createdAt),
    }));

  return <HomeScreenClient cards={cards} />;
}
