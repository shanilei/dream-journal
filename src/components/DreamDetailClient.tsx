"use client";

import { useEffect } from "react";
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
  skipEntrance = false,
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
  skipEntrance?: boolean;
}) {
  const router = useRouter();

  // Strip ?transitioned=1 once mounted — it's only a one-time signal to
  // skip re-playing the entrance right after the Gallery's own overlay
  // already played it. A later refresh/direct link to this same URL
  // should show the normal entrance, not silently stay "skipped" forever.
  useEffect(() => {
    if (skipEntrance) {
      router.replace(`/dream/${id}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      skipEntrance={skipEntrance}
    />
  );
}
