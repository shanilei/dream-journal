import { notFound } from "next/navigation";
import { getDream } from "@/dreams-store";
import DreamDetailClient from "@/components/DreamDetailClient";

function shortSymbol(symbol: string): string {
  return symbol.split(" - ")[0].trim();
}

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
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
      imageUrl={dream.imageUrl}
      dateLabel={formatDateLabel(dream.createdAt)}
      timeLabel={formatTimeLabel(dream.createdAt)}
      mood={dream.mood}
      summaryText={dream.summaryText}
      symbols={dream.symbols.slice(0, 3).map(shortSymbol)}
      dreamText={dream.dreamText}
    />
  );
}
