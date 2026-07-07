"use client";

import { useRouter } from "next/navigation";
import DreamResultScreen from "./DreamResultScreen";

export default function DreamDetailClient({
  id,
  name,
  imageUrl,
  clearImageUrl,
  printImageUrl,
  createdAt,
  mood,
  summaryText,
  interpretationText,
  symbols,
  dreamText,
}: {
  id: string;
  name?: string;
  imageUrl: string;
  clearImageUrl?: string;
  printImageUrl?: string;
  createdAt: string;
  mood: string;
  summaryText: string;
  interpretationText?: string;
  symbols: string[];
  dreamText?: string;
}) {
  const router = useRouter();

  return (
    <DreamResultScreen
      id={id}
      name={name}
      imageUrl={imageUrl}
      clearImageUrl={clearImageUrl}
      printImageUrl={printImageUrl}
      createdAt={createdAt}
      mood={mood}
      summaryText={summaryText}
      interpretationText={interpretationText}
      symbols={symbols}
      dreamText={dreamText}
      onBack={() => router.push("/gallery")}
    />
  );
}
