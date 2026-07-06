import { notFound } from "next/navigation";
import { getDream } from "@/dreams-store";

export const dynamic = "force-dynamic";
import DreamDetailClient from "@/components/DreamDetailClient";

function shortSymbol(symbol: string): string {
  return symbol.split(" - ")[0].trim();
}

export default async function DreamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dream = await getDream(id);

  if (!dream) notFound();

  return (
    <DreamDetailClient
      id={id}
      name={dream.name}
      imageUrl={dream.imageUrl}
      clearImageUrl={dream.clearImageUrl}
      createdAt={dream.createdAt}
      mood={dream.mood}
      summaryText={dream.summaryText}
      interpretationText={dream.interpretationText}
      symbols={dream.symbols.slice(0, 3).map(shortSymbol)}
      dreamText={dream.dreamText}
    />
  );
}
