"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { visualVariants } from "./motion";
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
      <motion.div variants={visualVariants}>
        <div className={`${styles.logoWindow} ${leaving ? styles.logoLeaving : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/onboarding/lucid-logo.png" alt="Lucid" className={styles.logo} />
        </div>
      </motion.div>
    </div>
  );
}
