"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
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

const WORDS_PER_LINE = 4;
const MAX_LINES = 6;

function getTranscriptLines(text: string): { key: number; text: string }[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: { key: number; text: string }[] = [];
  for (let i = 0; i < words.length; i += WORDS_PER_LINE) {
    lines.push({ key: Math.floor(i / WORDS_PER_LINE), text: words.slice(i, i + WORDS_PER_LINE).join(" ") });
  }
  return lines.slice(-MAX_LINES);
}

export default function RecordPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const isHe = lang === "he";

  const screenRef = useRef<HTMLDivElement>(null);
  const orbBtnControls = useAnimationControls();
  const pendingAudioRef = useRef<Blob | null>(null);
  const baseTranscriptRef = useRef("");
  const lastTranscriptRef = useRef("");

  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<DreamResult | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [frozenTranscript, setFrozenTranscript] = useState("");
  const [orbY, setOrbY] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  const isRecording = status === "recording";
  const isCaptured = status === "captured";
  const isActive = isRecording || isCaptured;
  const isIdle = status === "idle" || status === "error";

  // Compute y offset once when active state changes
  useEffect(() => {
    if (!screenRef.current) return;
    if (isActive) {
      const h = screenRef.current.clientHeight;
      const idleCenterY = h * 0.3077 + 20 + 130;
      const activeCenterY = h - 90 - 130;
      setOrbY(activeCenterY - idleCenterY);
    } else {
      setOrbY(0);
    }
  }, [isActive]);

  // Breathing animation toggle
  useEffect(() => {
    if (isRecording) {
      orbBtnControls.start({
        scale: [1, 1.035, 1],
        transition: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatType: "loop" },
      });
    } else {
      orbBtnControls.start({ scale: 1, transition: { duration: 0.6, ease: "easeInOut" } });
    }
  }, [isRecording, orbBtnControls]);

  // Pulse ring on transcript update
  useEffect(() => {
    if (!isRecording || liveTranscript === lastTranscriptRef.current) return;
    lastTranscriptRef.current = liveTranscript;
    setPulseCount((n) => n + 1);
  }, [liveTranscript, isRecording]);

  async function handleOrbClick() {
    if (isRecording) {
      setFrozenTranscript(liveTranscript);
      setStatus("captured");
      return;
    }
    if (!isIdle) return;

    // Tap reaction: squish → expand → settle
    await orbBtnControls.start({
      scale: [1, 0.88, 1.1, 1],
      transition: { duration: 0.32, times: [0, 0.25, 0.7, 1], ease: "easeOut" },
    });

    baseTranscriptRef.current = "";
    lastTranscriptRef.current = "";
    setLiveTranscript("");
    setFrozenTranscript("");
    setPulseCount(0);
    setAudioReady(false);
    pendingAudioRef.current = null;
    setStatus("recording");
  }

  function handleContinue() {
    baseTranscriptRef.current = frozenTranscript;
    lastTranscriptRef.current = frozenTranscript;
    setFrozenTranscript("");
    pendingAudioRef.current = null;
    setAudioReady(false);
    setStatus("recording");
  }

  async function handleAnalyze() {
    const audio = pendingAudioRef.current;
    if (!audio) return;
    setStatus("loading");
    try {
      if (audio.size === 0) throw new Error("empty audio");
      const form = new FormData();
      form.append("audio", audio, "dream.webm");
      const txRes = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!txRes.ok) throw new Error("transcription failed");
      const { text: audioText } = await txRes.json();
      const fullText = baseTranscriptRef.current
        ? `${baseTranscriptRef.current} ${audioText}`.trim()
        : audioText;
      if (!fullText) throw new Error("empty transcript");

      const dreamRes = await fetch("/api/dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fullText }),
      });
      if (!dreamRes.ok) throw new Error("dream failed");
      const data = await dreamRes.json();

      setResult({
        id: data.id,
        name: data.name,
        imageUrl: data.imageUrl,
        clearImageUrl: data.clearImageUrl,
        createdAt: new Date().toISOString(),
        mood: data.mood,
        summaryText: (data.analysis.themes ?? []).slice(0, 2).join(". "),
        interpretationText: data.interpretationText,
        symbols: (data.analysis.symbols ?? []).slice(0, 3).map((s: string) => s.split(" - ")[0].trim()),
        dreamText: fullText,
      });
      setStatus("result");
    } catch (err) {
      console.error("dream flow failed:", err);
      setStatus("error");
    }
  }

  function handleRecordingComplete(audio: Blob) {
    pendingAudioRef.current = audio;
    setAudioReady(true);
  }

  function handleTranscriptUpdate(text: string) {
    const full = baseTranscriptRef.current ? `${baseTranscriptRef.current} ${text}`.trim() : text;
    setLiveTranscript(full);
  }

  if (status === "result" && result) {
    return <DreamResultScreen {...result} onBack={() => router.push("/gallery")} />;
  }
  if (status === "loading") return <DreamLoadingScreen />;

  const displayText = isCaptured ? frozenTranscript : liveTranscript;
  const transcriptLines = getTranscriptLines(displayText);

  return (
    <div ref={screenRef} className={styles.screen}>
      {/* Background */}
      <motion.div
        className={styles.glowNavy}
        animate={{ opacity: isActive ? 1 : 0.85 }}
        transition={{ duration: 1.0 }}
      />
      <motion.div
        className={styles.glowBlue}
        animate={{ opacity: isActive ? 0.38 : 0.25 }}
        transition={{ duration: 1.0 }}
      />
      <motion.div
        className={styles.glowPurple}
        animate={{ opacity: isActive ? 0.32 : 0.2 }}
        transition={{ duration: 1.0 }}
      />
      <div className={styles.starfield} />

      {/* Prompt — idle only */}
      <AnimatePresence>
        {isIdle && (
          <motion.p
            key="prompt"
            className={`${styles.prompt} ${isHe ? styles.promptHe : ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {lang === "he"
              ? t.recordPrompt.split("\n").map((line, i) => (
                  <span key={i} className={styles.promptLine}>{line}</span>
                ))
              : t.recordPrompt}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Transcript area */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="transcriptArea"
            className={styles.transcriptArea}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AnimatePresence initial={false}>
              {transcriptLines.map(({ key, text }, idx) => {
                const relIdx = transcriptLines.length - 1 - idx;
                const baseOpacity = relIdx === 0 ? 1 : Math.max(0.18, 0.85 - relIdx * 0.22);
                const targetOpacity = isCaptured ? baseOpacity * 0.28 : baseOpacity;
                return (
                  <motion.p
                    key={key}
                    className={styles.transcriptLine}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: targetOpacity, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ type: "spring", stiffness: 160, damping: 22 }}
                  >
                    {text}
                  </motion.p>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orb wrapper — centered via margin auto, y animated by Framer Motion */}
      <motion.div
        className={styles.orbWrap}
        animate={{ y: orbY }}
        transition={{ type: "spring", stiffness: 190, damping: 26, mass: 0.85 }}
      >
        {/* Transcript pulse ring */}
        <AnimatePresence>
          {isRecording && pulseCount > 0 && (
            <motion.div
              key={pulseCount}
              className={styles.orbPulseRing}
              initial={{ scale: 0.85, opacity: 0.55 }}
              animate={{ scale: 1.55, opacity: 0 }}
              transition={{ duration: 0.85, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          className={styles.recordButton}
          animate={orbBtnControls}
          onClick={handleOrbClick}
          aria-pressed={isRecording}
          aria-label={isRecording ? "Stop recording" : "Record dream"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/orb-anim.gif" alt="" className={styles.orbGif} />
        </motion.button>
      </motion.div>

      {/* Captured: Dream captured label + action buttons */}
      <AnimatePresence>
        {isCaptured && (
          <motion.div
            key="capturedArea"
            className={styles.capturedArea}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, delay: 0.15, ease: [0.34, 1.1, 0.64, 1] }}
          >
            <p className={`${styles.capturedLabel} ${isHe ? styles.capturedLabelHe : ""}`}>
              {isHe ? "החלום נוצר" : "Dream captured"}
            </p>
            <div className={styles.capturedButtons}>
              <button type="button" className={styles.continueBtn} onClick={handleContinue}>
                {isHe ? "המשך הקלטה" : "Continue Recording"}
              </button>
              <button
                type="button"
                className={styles.analyzeBtn}
                onClick={handleAnalyze}
                disabled={!audioReady}
              >
                {isHe ? "לנתח את החלום" : "Analyze Dream"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Type fallback — idle only */}
      <AnimatePresence>
        {isIdle && (
          <motion.div
            key="typeFallback"
            className={styles.typeFallback}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
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

      {/* Bottom nav — idle only */}
      <AnimatePresence>
        {isIdle && (
          <motion.div
            key="nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
          >
            <BottomNav active="record" />
          </motion.div>
        )}
      </AnimatePresence>

      <VoiceRecordCircle
        isRecording={isRecording}
        onPermissionDenied={() => setStatus("idle")}
        onRecordingComplete={handleRecordingComplete}
        onTranscriptUpdate={handleTranscriptUpdate}
      />
    </div>
  );
}
