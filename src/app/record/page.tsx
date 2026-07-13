"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./record.module.css";
import BottomNav from "@/components/BottomNav";
import DreamLoadingScreen from "@/components/DreamLoadingScreen";
import DreamResultScreen from "@/components/DreamResultScreen";
import VoiceRecordCircle from "@/components/VoiceRecordCircle";
import { useLanguage } from "@/components/LanguageProvider";
import { CloseIcon, PauseIcon, PlayIcon, RepeatIcon } from "@/components/Icons";

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

type Status = "idle" | "recording" | "loading" | "result" | "error";

function summarize(themes: string[]): string {
  return themes.length ? `${themes.slice(0, 2).join(". ")}.` : "";
}

function shortSymbol(symbol: string): string {
  return symbol.split(" - ")[0].trim();
}

const AUDIO_BAR_COUNT = 5;

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function RecordPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<DreamResult | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [restartToken, setRestartToken] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(() => Array(AUDIO_BAR_COUNT).fill(0));
  // Set right before tearing down the recorder for a reason other than
  // "the user is done, submit it" (cancel or restart) — the teardown
  // still fires VoiceRecordCircle's onRecordingComplete with whatever was
  // captured so far, so this tells the handler below to throw that away
  // instead of sending it off for transcription.
  const pendingActionRef = useRef<"submit" | "discard">("submit");

  const isRecording = status === "recording";

  // Ticks once a second while actively recording; pausing freezes it in
  // place instead of continuing to count silent time.
  useEffect(() => {
    if (!isRecording || isPaused) return;
    const interval = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Resets to 0 whenever a fresh recording starts (including "repeat").
  useEffect(() => {
    if (isRecording) setElapsedSec(0);
  }, [isRecording, restartToken]);

  function handleStop() {
    setStatus("loading");
  }

  function handleCancel() {
    pendingActionRef.current = "discard";
    setIsPaused(false);
    setStatus("idle");
  }

  function handleRepeat() {
    pendingActionRef.current = "discard";
    setIsPaused(false);
    setRestartToken((n) => n + 1);
  }

  function handleTogglePause() {
    setIsPaused((p) => !p);
  }

  async function handleRecordingComplete(audio: Blob) {
    if (pendingActionRef.current === "discard") {
      pendingActionRef.current = "submit";
      return;
    }
    setStatus("loading");
    try {
      if (audio.size === 0) throw new Error("recorded audio was empty");

      const audioForm = new FormData();
      audioForm.append("audio", audio, "dream.webm");
      audioForm.append("lang", lang);
      const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: audioForm });
      if (!transcribeRes.ok) throw new Error("transcription failed");
      const { text } = await transcribeRes.json();
      if (!text) throw new Error("empty transcript");

      const dreamRes = await fetch("/api/dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      if (!dreamRes.ok) throw new Error("dream processing failed");
      const data = await dreamRes.json();

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

  return (
    <div className={`${styles.screen} lockedScreen`}>
      <div className={styles.glowNavy} />
      <div className={styles.glowBlue} />
      <div className={styles.glowPurple} />
      <div className={styles.starfield} />

      {isRecording && (
        <button
          type="button"
          className={`${styles.closeButton} ${lang === "he" ? styles.closeButtonHe : ""}`}
          onClick={handleCancel}
          aria-label={t.recordClose}
        >
          <CloseIcon size={16} />
        </button>
      )}

      <p className={`${styles.prompt} ${lang === "he" ? styles.promptHe : ""}`}>
        {status === "error"
          ? t.recordError
          : isRecording
          ? t.recordingPrompt.split("\n").map((line, i) => (
              <span key={i} className={styles.promptLine}>{line}</span>
            ))
          : lang === "he"
          ? t.recordPrompt.split("\n").map((line, i) => (
              <span key={i} className={styles.promptLine}>{line}</span>
            ))
          : t.recordPrompt}
      </p>

      <VoiceRecordCircle
        isRecording={isRecording}
        isPaused={isPaused}
        restartToken={restartToken}
        onPermissionDenied={() => setStatus("idle")}
        onRecordingComplete={handleRecordingComplete}
        onTranscriptUpdate={() => {}}
        onAudioLevels={setAudioLevels}
        audioBarCount={AUDIO_BAR_COUNT}
      />

      <button
        type="button"
        className={`${styles.recordButton} ${isRecording ? styles.recordButtonActive : ""} ${isPaused ? styles.recordButtonPaused : ""}`}
        onClick={isRecording ? handleStop : () => setStatus("recording")}
        aria-pressed={isRecording}
        aria-label="Record dream"
      >
        {/* GIFs can't be paused via CSS, so idle/paused uses a static frame
            and only active recording swaps in the looping animation. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={isRecording && !isPaused ? "/images/orb-anim.gif" : "/images/orb-static.png"}
          alt=""
          className={styles.orbGif}
        />
      </button>

      {!isRecording && (
        <div className={styles.typeFallback}>
          <span className={`${styles.typeFallbackOr} ${lang === "he" ? styles.typeFallbackOrHe : ""}`}>{t.recordOr}</span>
          <Link className={`${styles.typeFallbackLink} ${lang === "he" ? styles.typeFallbackLinkHe : ""}`} href="/record/type">
            {t.recordTypeIt}
          </Link>
        </div>
      )}

      {isRecording && (
        <div className={styles.controlRow}>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={handleTogglePause}
            aria-label={isPaused ? t.recordResume : t.recordPause}
          >
            {isPaused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
          </button>
          <button
            type="button"
            className={styles.recordingPill}
            onClick={handleStop}
            aria-label={t.recordStop}
            aria-live="polite"
          >
            <span className={styles.recordingWaveform} aria-hidden="true">
              {audioLevels.map((level, i) => (
                <span
                  key={i}
                  className={styles.recordingBar}
                  style={{ height: `${4 + Math.round(level * 32)}px` }}
                />
              ))}
            </span>
            <span className={styles.recordingTime}>{formatElapsed(elapsedSec)}</span>
          </button>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={handleRepeat}
            aria-label={t.recordRepeat}
          >
            <RepeatIcon size={16} />
          </button>
        </div>
      )}

      <BottomNav active="record" hidden={isRecording} />
    </div>
  );
}
