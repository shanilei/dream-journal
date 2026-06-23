"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DreamTypeScreen from "@/components/DreamTypeScreen";
import DreamResultScreen from "@/components/DreamResultScreen";
import DreamLoadingScreen from "@/components/DreamLoadingScreen";

type DreamResult = {
  imageUrl: string;
  dateLabel: string;
  timeLabel: string;
  mood: string;
  summaryText: string;
  symbols: string[];
};

function formatDateLabel(): string {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTimeLabel(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

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
        imageUrl: data.imageUrl,
        dateLabel: formatDateLabel(),
        timeLabel: formatTimeLabel(),
        mood: data.mood,
        summaryText: summarize(data.analysis.themes ?? []),
        symbols: (data.analysis.symbols ?? []).slice(0, 3).map(shortSymbol),
      });
      setStatus("result");
    } catch {
      setStatus("error");
    }
  }

  if (status === "result" && result) {
    return <DreamResultScreen {...result} onBack={() => router.push("/")} />;
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
