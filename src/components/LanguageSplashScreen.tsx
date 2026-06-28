"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LanguageSplashScreen.module.css";
import Logo from "./Logo";
import { useLanguage, LANGUAGE_CHOSEN_KEY } from "./LanguageProvider";
import type { Lang } from "@/i18n/translations";

const CYCLE_MS = 10000;
const FADE_MS = 900;

const HINTS: Record<Lang, string> = {
  en: "Tap to continue in English",
  he: "הקש כדי להמשיך בעברית",
};

export default function LanguageSplashScreen() {
  const router = useRouter();
  const { setLang } = useLanguage();
  const [displayedLang, setDisplayedLang] = useState<Lang>("en");
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function scheduleNext() {
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setDisplayedLang((l) => (l === "en" ? "he" : "en"));
          setVisible(true);
          scheduleNext();
        }, FADE_MS);
      }, CYCLE_MS);
    }
    scheduleNext();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleChoose() {
    setLang(displayedLang);
    try {
      localStorage.setItem(LANGUAGE_CHOSEN_KEY, "1");
    } catch {
      // private browsing or storage disabled — continue anyway
    }
    router.push("/onboarding");
  }

  return (
    <div className={styles.screen}>
      <div className={styles.starfield} />
      <button type="button" className={styles.logoButton} onClick={handleChoose} aria-label="Choose language">
        <div className={`${styles.logoWrap} ${visible ? styles.logoWrapVisible : ""}`}>
          <Logo lang={displayedLang} size={48} />
        </div>
      </button>
      <p className={`${styles.hint} ${styles.logoWrap} ${visible ? styles.logoWrapVisible : ""}`}>
        {HINTS[displayedLang]}
      </p>
    </div>
  );
}
