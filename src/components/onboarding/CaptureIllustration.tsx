"use client";

import styles from "./CaptureIllustration.module.css";

export default function CaptureIllustration({ bubble1, bubble2 }: { bubble1: string; bubble2: string }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.orbGlow} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/orb-anim.gif" alt="" className={styles.orb} />
      <span className={`${styles.bubble} ${styles.bubbleTopLeft}`} dir="auto">{bubble1}</span>
      <span className={`${styles.bubble} ${styles.bubbleBottomRight}`} dir="auto">{bubble2}</span>
    </div>
  );
}
