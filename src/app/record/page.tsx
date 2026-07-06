"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./record.module.css";
import BottomNav from "@/components/BottomNav";
import DreamLoadingScreen from "@/components/DreamLoadingScreen";
import DreamResultScreen from "@/components/DreamResultScreen";
import VoiceRecordCircle from "@/components/VoiceRecordCircle";
import { useLanguage } from "@/components/LanguageProvider";

type DreamResult = {
  id: string;
  name?: string;
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
  const { t, lang } = useLanguage();
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<DreamResult | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");

  async function handleRecordingComplete(audio: Blob) {
    setLiveTranscript("");
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
        id: data.id,
        name: data.name,
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
    return <DreamResultScreen {...result} onBack={() => router.push("/gallery")} />;
  }

  if (status === "loading") {
    return <DreamLoadingScreen />;
  }

  const isRecording = status === "recording";

  return (
    <div className={styles.screen}>
      <div className={styles.glowNavy} />
      <div className={styles.glowBlue} />
      <div className={styles.glowPurple} />
      <div className={styles.starfield} />

      <p className={`${styles.prompt} ${lang === "he" ? styles.promptHe : ""}`}>
        {status === "error"
          ? t.recordError
          : isRecording
          ? t.recordingPrompt
          : lang === "he"
          ? t.recordPrompt.split("\n").map((line, i) => (
              <span key={i} className={styles.promptLine}>{line}</span>
            ))
          : t.recordPrompt}
      </p>

      {/* VoiceRecordCircle handles all recording/speech logic invisibly */}
      <VoiceRecordCircle
        isRecording={isRecording}
        onPermissionDenied={() => setStatus("idle")}
        onRecordingComplete={handleRecordingComplete}
        onTranscriptUpdate={setLiveTranscript}
      />

      <button
        type="button"
        className={styles.recordButton}
        onClick={() => setStatus(isRecording ? "loading" : "recording")}
        aria-pressed={isRecording}
        aria-label="Record dream"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/orb-anim.gif"
          alt=""
          className={styles.orbGif}
        />
      </button>

      {isRecording && liveTranscript && (
        <p className={styles.liveTranscript}>{liveTranscript}</p>
      )}

      <div className={styles.typeFallback}>
        <span className={`${styles.typeFallbackOr} ${lang === "he" ? styles.typeFallbackOrHe : ""}`}>{t.recordOr}</span>
        <Link className={`${styles.typeFallbackLink} ${lang === "he" ? styles.typeFallbackLinkHe : ""}`} href="/record/type">
          {t.recordTypeIt}
        </Link>
      </div>

      <BottomNav active="record" />
    </div>
  );
}
