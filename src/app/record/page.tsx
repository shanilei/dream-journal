"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

type Status = "idle" | "recording" | "captured" | "loading" | "result" | "error";

function summarize(themes: string[]): string {
  return themes.length ? `${themes.slice(0, 2).join(". ")}.` : "";
}

function shortSymbol(symbol: string): string {
  return symbol.split(" - ")[0].trim();
}

function formatTime(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const WORDS_PER_LINE = 6;

export default function RecordPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const isHe = lang === "he";

  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<DreamResult | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [frozenTranscript, setFrozenTranscript] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const pendingAudioRef = useRef<Blob | null>(null);

  const isRecording = status === "recording";
  const isCaptured = status === "captured";
  const isIdle = status === "idle" || status === "error";

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRecording) { setElapsedSeconds(0); return; }
    const id = setInterval(() => setElapsedSeconds((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  // ── Transcript lines (stable keys prevent jumping) ────────────────────────
  const displayText = isCaptured ? frozenTranscript : liveTranscript;
  const transcriptLines = useMemo(() => {
    const words = displayText.trim().split(/\s+/).filter(Boolean);
    const lines: { key: number; text: string }[] = [];
    for (let i = 0; i < words.length; i += WORDS_PER_LINE) {
      lines.push({ key: Math.floor(i / WORDS_PER_LINE), text: words.slice(i, i + WORDS_PER_LINE).join(" ") });
    }
    return lines.slice(-3);
  }, [displayText]);

  // ── Recording complete callback ───────────────────────────────────────────
  async function handleRecordingComplete(audio: Blob) {
    pendingAudioRef.current = audio;
    setAudioReady(true);
  }

  // ── Analyze (user-triggered after captured) ───────────────────────────────
  async function handleAnalyze() {
    const audio = pendingAudioRef.current;
    if (!audio) return;
    setStatus("loading");
    try {
      if (audio.size === 0) throw new Error("empty audio");

      const audioForm = new FormData();
      audioForm.append("audio", audio, "dream.webm");
      const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: audioForm });
      if (!transcribeRes.ok) throw new Error("transcription failed");
      const { text } = await transcribeRes.json();
      if (!text) throw new Error("empty transcript");

      const dreamRes = await fetch("/api/dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!dreamRes.ok) throw new Error("dream processing failed");
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

  function handleRetake() {
    pendingAudioRef.current = null;
    setAudioReady(false);
    setFrozenTranscript("");
    setLiveTranscript("");
    setStatus("idle");
  }

  function handleOrbClick() {
    if (isRecording) {
      setFrozenTranscript(liveTranscript);
      setStatus("captured");
    } else if (isIdle) {
      setStatus("recording");
    }
  }

  // ── Result / Loading screens ─────────────────────────────────────────────
  if (status === "result" && result) {
    return <DreamResultScreen {...result} onBack={() => router.push("/gallery")} />;
  }
  if (status === "loading") {
    return <DreamLoadingScreen />;
  }

  // ── Prompt text ───────────────────────────────────────────────────────────
  const promptKey = isRecording ? "recording" : "idle";
  const promptText =
    status === "error" ? t.recordError
    : isRecording ? t.recordingPrompt
    : isCaptured ? ""
    : lang === "he"
    ? t.recordPrompt
    : t.recordPrompt;

  return (
    <div className={styles.screen}>
      {/* ── Background ─────────────────────────────────────────────────── */}
      <motion.div
        className={styles.glowNavy}
        animate={{ opacity: isRecording ? 1 : 0.85 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      <motion.div
        className={styles.glowBlue}
        animate={{ opacity: isRecording ? 0.38 : 0.25 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      <motion.div
        className={styles.glowPurple}
        animate={{ opacity: isRecording ? 0.32 : 0.2 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      <div className={styles.starfield} />

      {/* ── Prompt crossfade ───────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {promptText ? (
          <motion.p
            key={promptKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`${styles.prompt} ${isHe ? styles.promptHe : ""}`}
          >
            {!isRecording && lang === "he"
              ? t.recordPrompt.split("\n").map((line, i) => (
                  <span key={i} className={styles.promptLine}>{line}</span>
                ))
              : promptText}
          </motion.p>
        ) : null}
      </AnimatePresence>

      {/* ── Orb ────────────────────────────────────────────────────────── */}
      <div className={styles.recordButtonWrap}>
        <motion.button
          type="button"
          className={styles.recordButton}
          onClick={handleOrbClick}
          aria-pressed={isRecording}
          aria-label={isRecording ? "Stop recording" : "Record dream"}
          animate={isRecording ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={
            isRecording
              ? { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }
              : { duration: 0.6, ease: "easeInOut" }
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/orb-anim.gif" alt="" className={styles.orbGif} />
        </motion.button>
      </div>

      {/* ── Timer ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isRecording && (
          <motion.p
            key="timer"
            className={styles.timer}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {formatTime(elapsedSeconds)}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Live transcript ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {(isRecording || isCaptured) && transcriptLines.length > 0 && (
          <motion.div
            key="transcriptArea"
            className={styles.transcriptArea}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence initial={false}>
              {transcriptLines.map(({ key, text }, idx) => {
                const relIdx = transcriptLines.length - 1 - idx; // 0 = newest
                const targetOpacity = relIdx === 0 ? 1 : relIdx === 1 ? 0.5 : 0.22;
                return (
                  <motion.p
                    key={key}
                    className={styles.transcriptLine}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: targetOpacity, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ type: "spring", stiffness: 220, damping: 28 }}
                  >
                    {text}
                  </motion.p>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Captured state ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCaptured && (
          <>
            <motion.p
              key="capturedMsg"
              className={`${styles.capturedMsg} ${isHe ? styles.capturedMsgHe : ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
            >
              {isHe ? "החלום נוצר" : "Dream captured"}
            </motion.p>

            <motion.div
              key="capturedActions"
              className={styles.capturedActions}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.45, delay: 0.45, ease: [0.34, 1.2, 0.64, 1] }}
            >
              <button
                type="button"
                className={styles.analyzeBtn}
                onClick={handleAnalyze}
                disabled={!audioReady}
              >
                {isHe ? "לנתח את החלום" : "Analyze Dream"}
              </button>
              <button
                type="button"
                className={styles.retakeBtn}
                onClick={handleRetake}
              >
                {isHe ? "הקלט שוב" : "Record Again"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Type fallback (idle only) ──────────────────────────────────── */}
      <AnimatePresence>
        {isIdle && (
          <motion.div
            key="typeFallback"
            className={styles.typeFallback}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <span className={`${styles.typeFallbackOr} ${isHe ? styles.typeFallbackOrHe : ""}`}>{t.recordOr}</span>
            <Link
              className={`${styles.typeFallbackLink} ${isHe ? styles.typeFallbackLinkHe : ""}`}
              href="/record/type"
            >
              {t.recordTypeIt}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav active="record" />

      {/* VoiceRecordCircle handles all recording/speech logic invisibly */}
      <VoiceRecordCircle
        isRecording={isRecording}
        onPermissionDenied={() => setStatus("idle")}
        onRecordingComplete={handleRecordingComplete}
        onTranscriptUpdate={setLiveTranscript}
      />
    </div>
  );
}
