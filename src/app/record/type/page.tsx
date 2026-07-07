"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DreamTypeScreen from "@/components/DreamTypeScreen";
import DreamResultScreen from "@/components/DreamResultScreen";
import DreamLoadingScreen from "@/components/DreamLoadingScreen";

type DreamResult = {
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
  dreamText: string;
};

function summarize(themes: string[]): string {
  return themes.length ? `${themes.slice(0, 2).join(". ")}.` : "";
}

function shortSymbol(symbol: string): string {
  return symbol.split(" - ")[0].trim();
}

export default function TypeDreamPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"typing" | "loading" | "result" | "error">("typing");
  const [result, setResult] = useState<DreamResult | null>(null);

  async function handleSubmit() {
    setStatus("loading");
    try {
      const res = await fetch("/api/dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      setResult({
        id: data.id,
        name: data.name,
        imageUrl: data.imageUrl,
        clearImageUrl: data.clearImageUrl,
        printImageUrl: data.printImageUrl,
        createdAt: new Date().toISOString(),
        mood: data.mood,
        summaryText: summarize(data.analysis.themes ?? []),
        interpretationText: data.interpretationText,
        symbols: (data.analysis.symbols ?? []).slice(0, 3).map(shortSymbol),
        dreamText: text,
      });
      setStatus("result");
    } catch {
      setStatus("error");
    }
  }

  if (status === "result" && result) {
    return <DreamResultScreen {...result} onBack={() => router.push("/gallery")} />;
  }

  if (status === "loading") {
    return <DreamLoadingScreen />;
  }

  return (
    <DreamTypeScreen
      value={text}
      onChange={setText}
      onSubmit={handleSubmit}
      status={status === "error" ? "error" : "typing"}
    />
  );
}
