"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./OnboardingCarousel.module.css";
import { ChevronRightIcon } from "./Icons";

const STEPS = [
  { num: "01", label: "Write your dream" },
  { num: "02", label: "Let the app think" },
  { num: "03", label: "Get your analyze" },
];

const SLOT_LAYOUT = [
  { prominent: 0, rightPeek: 1, leftPeek: 2 },
  { prominent: 1, rightPeek: 0, leftPeek: 2 },
  { prominent: 2, rightPeek: 0, leftPeek: 1 },
];

export default function OnboardingCarousel() {
  const [slideIndex, setSlideIndex] = useState(0);
  const router = useRouter();
  const slots = SLOT_LAYOUT[slideIndex];

  function handleBack() {
    if (slideIndex > 0) setSlideIndex(slideIndex - 1);
  }

  function handleNext() {
    if (slideIndex < STEPS.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      router.push("/record");
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.bg} />
      <p className={styles.logo}>LUCID</p>

      <div className={`${styles.card} ${styles.cardProminent}`}>
        <span className={styles.cardNum}>{STEPS[slots.prominent].num}</span>
        <span className={styles.cardLabel}>{STEPS[slots.prominent].label}</span>
      </div>
      <div className={`${styles.card} ${styles.cardRightPeek}`}>
        <span className={styles.cardNum}>{STEPS[slots.rightPeek].num}</span>
        <span className={styles.cardLabel}>{STEPS[slots.rightPeek].label}</span>
      </div>
      <div className={`${styles.card} ${styles.cardLeftPeek}`}>
        <span className={styles.cardNum}>{STEPS[slots.leftPeek].num}</span>
        <span className={styles.cardLabel}>{STEPS[slots.leftPeek].label}</span>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={`${styles.navBtn} ${styles.backBtn}`}
          onClick={handleBack}
          disabled={slideIndex === 0}
          aria-label="Previous"
          style={{ transform: "scaleX(-1)" }}
        >
          <ChevronRightIcon color="#1d3a8f" />
        </button>
        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`${styles.dot} ${i === slideIndex ? styles.dotActive : ""}`}
            />
          ))}
        </div>
        <button
          type="button"
          className={`${styles.navBtn} ${styles.nextBtn}`}
          onClick={handleNext}
          aria-label="Next"
        >
          <ChevronRightIcon color="#1d3a14" />
        </button>
      </div>
    </div>
  );
}
