"use client";

import { useRouter } from "next/navigation";
import DreamResultScreen from "./DreamResultScreen";

export default function DreamDetailClient({
  imageUrl,
  dateLabel,
  timeLabel,
  mood,
  summaryText,
  symbols,
  dreamText,
}: {
  imageUrl: string;
  dateLabel: string;
  timeLabel?: string;
  mood: string;
  summaryText: string;
  symbols: string[];
  dreamText?: string;
}) {
  const router = useRouter();

  return (
    <DreamResultScreen
      imageUrl={imageUrl}
      dateLabel={dateLabel}
      timeLabel={timeLabel}
      mood={mood}
      summaryText={summaryText}
      symbols={symbols}
      dreamText={dreamText}
      onBack={() => router.push("/")}
    />
  );
}
