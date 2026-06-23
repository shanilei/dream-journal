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
}: {
  imageUrl: string;
  dateLabel: string;
  timeLabel?: string;
  mood: string;
  summaryText: string;
  symbols: string[];
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
      onBack={() => router.push("/")}
    />
  );
}
