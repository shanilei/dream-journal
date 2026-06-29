"use client";

import { useRouter } from "next/navigation";
import DreamResultScreen from "./DreamResultScreen";

export default function DreamDetailClient({
  imageUrl,
  clearImageUrl,
  createdAt,
  mood,
  summaryText,
  symbols,
  dreamText,
}: {
  imageUrl: string;
  clearImageUrl?: string;
  createdAt: string;
  mood: string;
  summaryText: string;
  symbols: string[];
  dreamText?: string;
}) {
  const router = useRouter();

  return (
    <DreamResultScreen
      imageUrl={imageUrl}
      clearImageUrl={clearImageUrl}
      createdAt={createdAt}
      mood={mood}
      summaryText={summaryText}
      symbols={symbols}
      dreamText={dreamText}
      onBack={() => router.push("/")}
    />
  );
}
