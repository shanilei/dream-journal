"use client";

import { useEffect, useState } from "react";
import styles from "./DreamLoadingScreen.module.css";
import { SparkleIcon, MoonPhaseIcon } from "./Icons";

const MOON_RING_COUNT = 28;
const MOON_RING_RADIUS_PX = 64;
const moonRingIcons = Array.from({ length: MOON_RING_COUNT }, (_, i) => {
  const angle = (i / MOON_RING_COUNT) * 2 * Math.PI - Math.PI / 2;
  return {
    phase: i / MOON_RING_COUNT,
    x: MOON_RING_RADIUS_PX * Math.cos(angle),
    y: MOON_RING_RADIUS_PX * Math.sin(angle),
  };
});

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
        <div className={styles.moonRing}>
          {moonRingIcons.map((icon, i) => (
            <span
              key={i}
              className={styles.moonRingIcon}
              style={{ transform: `translate(${icon.x}px, ${icon.y}px)` }}
            >
              <MoonPhaseIcon phase={icon.phase} size={16} color="currentColor" />
            </span>
          ))}
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
