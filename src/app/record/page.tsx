"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./record.module.css";
import BottomNav from "@/components/BottomNav";
import DreamLoadingScreen from "@/components/DreamLoadingScreen";
import DreamResultScreen from "@/components/DreamResultScreen";
import VoiceRecordCircle from "@/components/VoiceRecordCircle";

const MOCK_LOADING_MS = 4800;

const MOCK_RESULT = {
  imageUrl: "/images/cards/dream-2.png",
  dateLabel: "Jun 22",
  timeLabel: "06:08 PM",
  mood: "Confused",
  summaryText: "Demo result — voice transcription isn't connected yet.",
  symbols: ["Demo", "Voice", "Coming soon"],
};

type Status = "idle" | "recording" | "loading" | "result";

export default function RecordPage() {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status !== "loading") return;
    const timer = setTimeout(() => setStatus("result"), MOCK_LOADING_MS);
    return () => clearTimeout(timer);
  }, [status]);

  if (status === "result") {
    return <DreamResultScreen {...MOCK_RESULT} onBack={() => setStatus("idle")} />;
  }

  if (status === "loading") {
    return <DreamLoadingScreen />;
  }

  const isRecording = status === "recording";

  return (
    <div className={styles.screen}>
      <p className={styles.prompt}>
        {isRecording ? "Listening to the dream" : "Tap to record the dream"}
      </p>

      <div className={styles.ambientGlow} />

      <button
        type="button"
        className={styles.recordButton}
        onClick={() => setStatus(isRecording ? "loading" : "recording")}
        aria-pressed={isRecording}
        aria-label="Record dream"
      >
        <VoiceRecordCircle isRecording={isRecording} onPermissionDenied={() => setStatus("idle")} />
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
