"use client";

import { useEffect, useState } from "react";
import styles from "./DreamLoadingScreen.module.css";
import { SparkleIcon, MoonPhaseIcon } from "./Icons";
import { useLanguage } from "./LanguageProvider";

const MOON_RING_COUNT = 28;
const MOON_RING_RADIUS_PX = 64;
const CHASE_DURATION_MS = 2400;
const moonRingIcons = Array.from({ length: MOON_RING_COUNT }, (_, i) => {
  const angle = (i / MOON_RING_COUNT) * 2 * Math.PI - Math.PI / 2;
  return {
    phase: i / MOON_RING_COUNT,
    x: MOON_RING_RADIUS_PX * Math.cos(angle),
    y: MOON_RING_RADIUS_PX * Math.sin(angle),
    delayMs: (i / MOON_RING_COUNT) * CHASE_DURATION_MS,
  };
});

// Three stages, random wording each time.
const MESSAGE_STAGES: string[][] = [
  ["Thinking about you....", "Settling into your dream...", "Drifting into your memory..."],
  ["Start analysing your dream", "Mapping the symbols...", "Tracing the feeling..."],
  ["What a dream!", "There it is.", "Dream decoded."],
];

const MESSAGE_STAGES_HE: string[][] = [
  ["נכנסים לחלום שלך...", "שוקעים לתוך הזיכרון...", "מתחברים לחלום..."],
  ["מנתחים את הסמלים", "מפענחים את התחושה...", "קוראים את הדפוסים..."],
  ["איזה חלום!", "הנה זה.", "החלום פוענח."],
];

function pickMessages(he: boolean): string[] {
  const stages = he ? MESSAGE_STAGES_HE : MESSAGE_STAGES;
  return stages.map((options) => options[Math.floor(Math.random() * options.length)]);
}

const MESSAGE_DELAY_MS = 1600;

export default function DreamLoadingScreen() {
  const { lang } = useLanguage();
  const isHe = lang === "he";
  const [messages] = useState<string[]>(() => pickMessages(isHe));
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    if (visibleCount >= messages.length) return;
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), MESSAGE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [visibleCount, messages.length]);

  const noteText = isHe
    ? "פרשנות זו מיועדת כהצעה בלבד ונוצרת בחלקה באמצעות AI."
    : "This interpretation is intended as a suggestion only and is partially generated using AI.";
  const noteLabel = isHe ? "הערה:" : "Note:";

  return (
    <div className={`${styles.screen} lockedScreen`}>
      <div className={`${styles.nebula} ${styles.nebulaBlue}`} />
      <div className={`${styles.nebula} ${styles.nebulaPurple}`} />
      <div className={`${styles.nebula} ${styles.nebulaCyan}`} />

      <div className={styles.orbWrap}>
        <div className={styles.moonRing}>
          {moonRingIcons.map((icon, i) => (
            <span
              key={i}
              className={styles.moonRingIcon}
              style={{ transform: `translate(${icon.x}px, ${icon.y}px)` }}
            >
              <span className={styles.moonRingIconPulse} style={{ animationDelay: `${icon.delayMs}ms` }}>
                <MoonPhaseIcon phase={icon.phase} size={16} color="currentColor" />
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className={styles.messages}>
        {messages.slice(0, visibleCount).map((message, i) => (
          <div key={i} className={styles.messageRow}>
            <SparkleIcon size={12} color="currentColor" />
            <p className={`${styles.messageText} ${isHe ? styles.messageTextHe : ""}`} dir={isHe ? "rtl" : undefined}>
              {message}
            </p>
          </div>
        ))}
      </div>

      <div className={`${styles.noteBar} ${isHe ? styles.noteBarHe : ""}`}>
        <span className={styles.noteLabel}>{noteLabel}</span>
        <p className={styles.noteText}>{noteText}</p>
      </div>
    </div>
  );
}
