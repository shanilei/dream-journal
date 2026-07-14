import { notFound } from "next/navigation";
import { getDream } from "@/dreams-store";
import { shortSymbol } from "@/lib/dream-format";

export const dynamic = "force-dynamic";
import DreamDetailClient from "@/components/DreamDetailClient";

export default async function DreamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ transitioned?: string }>;
}) {
  const { id } = await params;
  const { transitioned } = await searchParams;
  const dream = await getDream(id);

  if (!dream) notFound();

  return (
    <DreamDetailClient
      id={id}
      name={dream.name}
      imageUrl={dream.imageUrl}
      clearImageUrl={dream.clearImageUrl}
      printImageUrl={dream.printImageUrl}
      createdAt={dream.createdAt}
      mood={dream.mood}
      summaryText={dream.summaryText}
      interpretationText={dream.interpretationText}
      symbols={dream.symbols.slice(0, 3).map(shortSymbol)}
      dreamText={dream.dreamText}
      skipEntrance={transitioned === "1"}
    />
  );
}
