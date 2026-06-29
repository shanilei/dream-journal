"use client";

import { useEffect, useState } from "react";
import styles from "./DreamLoadingScreen.module.css";
import { SparkleIcon } from "./Icons";

// Grouped by stage (opening → analysing → reveal) so every dream still
// follows the same three-beat arc, but the exact wording varies each time
// instead of repeating the identical three lines on every single dream.
const MESSAGE_STAGES: string[][] = [
  ["Thinking about you....", "Settling into your dream...", "Drifting into your memory..."],
  ["Start analysing your dream", "Mapping the symbols...", "Tracing the feeling..."],
  ["What a dream!", "There it is.", "Dream decoded."],
];

function pickMessages(): string[] {
  return MESSAGE_STAGES.map((options) => options[Math.floor(Math.random() * options.length)]);
}

const MESSAGE_DELAY_MS = 1600;

export default function DreamLoadingScreen() {
  const [messages] = useState(pickMessages);
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    if (visibleCount >= messages.length) return;
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), MESSAGE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [visibleCount, messages.length]);

  return (
    <div className={styles.screen}>
      <div className={styles.orbWrap}>
        <svg className={styles.orbRing} viewBox="0 0 220 220" fill="none">
          <circle
            cx="110"
            cy="110"
            r="100"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="22 18"
            strokeLinecap="round"
          />
        </svg>
        <div className={styles.orbGlow} />
        <div className={styles.moonWrap}>
          <div className={styles.moonShadow} />
        </div>
      </div>

      <div className={styles.messages}>
        {messages.slice(0, visibleCount).map((message, i) => (
          <div key={i} className={styles.messageRow}>
            <SparkleIcon size={12} color="currentColor" />
            <p className={styles.messageText}>{message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
