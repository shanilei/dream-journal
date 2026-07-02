"use client";

import { useRouter } from "next/navigation";
import styles from "./OnboardingScreen.module.css";
import { ArrowRightIcon } from "./Icons";

export const ONBOARDING_SESSION_KEY = "dj_onboarded";

export default function OnboardingScreen() {
  const router = useRouter();

  function handleGetStarted() {
    try {
      sessionStorage.setItem(ONBOARDING_SESSION_KEY, "1");
    } catch {
      // private browsing or storage disabled — just continue
    }
    router.push("/");
  }

  return (
    <div className={styles.screen}>
      {/* Glow stack — bottom to top: navy → blue-deep → purple */}
      <div className={styles.glowNavy} />
      <div className={styles.glowBlue} />
      <div className={styles.glowPurple} />

      {/* Starfield overlay */}
      <div className={styles.starfield} />

      <p className={styles.headline}>
        A personal journal for <span className={styles.accent}>dreams</span>
        <br />
        memories and <span className={styles.accent}>reflections</span>
      </p>

      <div className={styles.footer}>
        <div className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dotActive} />
        </div>

        <div className={styles.cta}>
          <span className={styles.ctaLabel}>Get started</span>
          <button
            type="button"
            className={styles.ctaOuter}
            onClick={handleGetStarted}
            aria-label="Get started"
          >
            <span className={styles.ctaMid}>
              <span className={styles.ctaInner}>
                <span className={styles.ctaIcon}>
                  <ArrowRightIcon size={24} color="var(--accent-primary)" />
                </span>
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
