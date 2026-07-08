"use client";

import styles from "./CaptureIllustration.module.css";

export default function CaptureIllustration({
  bubble1,
  bubble2,
  bubble3,
}: {
  bubble1: string;
  bubble2: string;
  bubble3: string;
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.orbGlow} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/onboarding/capture-orb.svg" alt="" className={styles.orb} />
      <span className={`${styles.bubble} ${styles.bubbleSolid} ${styles.bubble1}`} dir="auto">{bubble1}</span>
      <span className={`${styles.bubble} ${styles.bubble2}`} dir="auto">{bubble2}</span>
      <span className={`${styles.bubble} ${styles.bubble3}`} dir="auto">{bubble3}</span>
    </div>
  );
}
