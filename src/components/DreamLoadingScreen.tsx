"use client";

import { useEffect, useState } from "react";
import styles from "./DreamLoadingScreen.module.css";
import { SparkleIcon } from "./Icons";

const MESSAGES = ["Thinking about you....", "Start analysing your dream", "What a dream!"];
const MESSAGE_DELAY_MS = 1600;

export default function DreamLoadingScreen() {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    if (visibleCount >= MESSAGES.length) return;
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), MESSAGE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [visibleCount]);

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
      </div>

      <div className={styles.messages}>
        {MESSAGES.slice(0, visibleCount).map((message, i) => (
          <div key={i} className={styles.messageRow}>
            <SparkleIcon size={12} color="currentColor" />
            <p className={styles.messageText}>{message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
