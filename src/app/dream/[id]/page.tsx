import { notFound } from "next/navigation";
import { getDream } from "@/dreams-store";
import { shortSymbol } from "@/lib/dream-format";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
import DreamDetailClient from "@/components/DreamDetailClient";

export default async function DreamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ transitioned?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { transitioned } = await searchParams;
  // Scoped by user_id inside getDream — another user's dream id simply
  // doesn't match, so this 404s exactly like a nonexistent id, never
  // revealing that the id belongs to someone else.
  const dream = await getDream(id, user.id);

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
      captionOverride={dream.captionOverride}
      showDate={dream.showDate}
      showTime={dream.showTime}
      displayAt={dream.displayAt}
      captionFontSize={dream.captionFontSize}
      metaFontSize={dream.metaFontSize}
      skipEntrance={transitioned === "1"}
    />
  );
}
