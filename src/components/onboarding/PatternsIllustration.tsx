"use client";

import styles from "./PatternsIllustration.module.css";

export default function PatternsIllustration({
  waterLabel,
  waterSub,
  homeLabel,
  homeSub,
  tagSymbol,
  tagWords,
}: {
  waterLabel: string;
  waterSub: string;
  homeLabel: string;
  homeSub: string;
  tagSymbol: string;
  tagWords: string;
}) {
  return (
    <div className={styles.wrap}>
      <div className={`${styles.card} ${styles.cardFiller}`} aria-hidden="true" />
      <div className={`${styles.card} ${styles.cardBack}`}>
        <div className={styles.cardGlow} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/onboarding/pattern-card.png" alt="" className={styles.cardImg} />
        <div className={styles.cardScrim} />
        <div className={styles.cardCaption}>
          <p className={styles.cardTitle}>{waterLabel}</p>
          <p className={styles.cardSub}>{waterSub}</p>
        </div>
      </div>
      <div className={`${styles.card} ${styles.cardFront}`}>
        <div className={styles.cardGlow} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/onboarding/pattern-card.png" alt="" className={styles.cardImg} />
        <div className={styles.cardScrim} />
        <div className={styles.cardCaption}>
          <p className={styles.cardTitle}>{homeLabel}</p>
          <p className={styles.cardSub}>{homeSub}</p>
        </div>
      </div>
      <span className={`${styles.tag} ${styles.tagLeft}`} dir="auto">{tagSymbol}</span>
      <span className={`${styles.tag} ${styles.tagRight}`} dir="auto">{tagWords}</span>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/onboarding/arrow.svg" alt="" className={`${styles.arrow} ${styles.arrowLeft}`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/onboarding/arrow.svg" alt="" className={`${styles.arrow} ${styles.arrowRight}`} />
    </div>
  );
}
