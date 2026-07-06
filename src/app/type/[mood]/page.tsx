import DreamsByTypeScreen from "@/components/DreamsByTypeScreen";
import { listDreams } from "@/dreams-store";

export const dynamic = "force-dynamic";

export default async function TypePage({ params }: { params: Promise<{ mood: string }> }) {
  const { mood } = await params;
  const decodedMood = decodeURIComponent(mood);
  const dreams = (await listDreams().catch(() => [])).filter((dream) => dream.mood === decodedMood);

  return <DreamsByTypeScreen mood={decodedMood} dreams={dreams} />;
}
