"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./record.module.css";
import BottomNav from "@/components/BottomNav";
import DreamLoadingScreen from "@/components/DreamLoadingScreen";
import DreamResultScreen from "@/components/DreamResultScreen";
import VoiceRecordCircle from "@/components/VoiceRecordCircle";

type DreamResult = {
  imageUrl: string;
  clearImageUrl?: string;
  createdAt: string;
  mood: string;
  summaryText: string;
  interpretationText?: string;
  symbols: string[];
  dreamText: string;
};

type Status = "idle" | "recording" | "loading" | "result" | "error";

function summarize(themes: string[]): string {
  return themes.length ? `${themes.slice(0, 2).join(". ")}.` : "";
}

function shortSymbol(symbol: string): string {
  return symbol.split(" - ")[0].trim();
}

export default function RecordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<DreamResult | null>(null);

  async function handleRecordingComplete(audio: Blob) {
    setStatus("loading");
    console.log("recorded audio blob:", audio.type, audio.size, "bytes");
    try {
      if (audio.size === 0) throw new Error("recorded audio was empty");

      const audioForm = new FormData();
      audioForm.append("audio", audio, "dream.webm");
      const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: audioForm });
      if (!transcribeRes.ok) {
        console.error("transcribe failed:", transcribeRes.status, await transcribeRes.text());
        throw new Error("transcription failed");
      }
      const { text } = await transcribeRes.json();
      if (!text) throw new Error("empty transcript");

      const dreamRes = await fetch("/api/dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!dreamRes.ok) {
        console.error("dream processing failed:", dreamRes.status, await dreamRes.text());
        throw new Error("dream processing failed");
      }
      const data = await dreamRes.json();

      setResult({
        imageUrl: data.imageUrl,
        clearImageUrl: data.clearImageUrl,
        createdAt: new Date().toISOString(),
        mood: data.mood,
        summaryText: summarize(data.analysis.themes ?? []),
        interpretationText: data.interpretationText,
        symbols: (data.analysis.symbols ?? []).slice(0, 3).map(shortSymbol),
        dreamText: text,
      });
      setStatus("result");
    } catch (err) {
      console.error("voice dream flow failed:", err);
      setStatus("error");
    }
  }

  if (status === "result" && result) {
    return <DreamResultScreen {...result} onBack={() => router.push("/")} />;
  }

  if (status === "loading") {
    return <DreamLoadingScreen />;
  }

  const isRecording = status === "recording";

  return (
    <div className={styles.screen}>
      <p className={styles.prompt}>
        {status === "error"
          ? "Something went wrong — tap to try again"
          : isRecording
          ? "Listening to the dream"
          : "Tap to record the dream"}
      </p>

      <div className={styles.ambientGlow} />

      <button
        type="button"
        className={styles.recordButton}
        onClick={() => setStatus(isRecording ? "loading" : "recording")}
        aria-pressed={isRecording}
        aria-label="Record dream"
      >
        <VoiceRecordCircle
          isRecording={isRecording}
          onPermissionDenied={() => setStatus("idle")}
          onRecordingComplete={handleRecordingComplete}
        />
      </button>

      <div className={styles.typeFallback}>
        <span className={styles.typeFallbackOr}>OR</span>
        <Link className={styles.typeFallbackLink} href="/record/type">
          Type it
        </Link>
      </div>

      <BottomNav active="record" />
    </div>
  );
}
