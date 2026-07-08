"use client";

import { useEffect, useState } from "react";
import styles from "./SplashScreen.module.css";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), 900);
    const doneTimer = setTimeout(onDone, 900 + 700);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div className={styles.screen}>
      <div className={styles.glowNavy} />
      <div className={styles.glowBlue} />
      <div className={styles.glowPurple} />
      <div className={styles.starfield} />
      <div className={`${styles.logoWindow} ${leaving ? styles.logoLeaving : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/onboarding/lucid-logo.png" alt="Lucid" className={styles.logo} />
      </div>
    </div>
  );
}
