"use client";

import { useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import styles from "./error.module.css";

// Root-level error boundary — catches anything an uncaught Server/Client
// Component error in any route would otherwise leave to Next's own
// generic, unbranded error page (see the production error-handling audit
// this replaces). Renders inside the root layout, so AppBackground/fonts/
// providers are all still active behind it — no separate background of
// its own needed. Deliberately doesn't surface `error.message`/`.digest`
// to the user; it's only logged.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, lang } = useLanguage();

  useEffect(() => {
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <div className={styles.screen} dir={lang === "he" ? "rtl" : "ltr"}>
      <div className={styles.content}>
        <p className={styles.title}>{t.errorPageTitle}</p>
        <p className={styles.body}>{t.errorPageBody}</p>
        <button type="button" className={styles.retryBtn} onClick={() => reset()}>
          {t.errorPageRetry}
        </button>
      </div>
    </div>
  );
}
