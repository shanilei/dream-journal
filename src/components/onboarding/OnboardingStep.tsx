"use client";

import type { ReactNode } from "react";
import styles from "./OnboardingStep.module.css";
import { ArrowRightIcon } from "@/components/Icons";
import { useLanguage } from "@/components/LanguageProvider";

export default function OnboardingStep({
  variant,
  skipLabel,
  onSkip,
  headline,
  subtitle,
  illustration,
  dotIndex,
  dotCount,
  ctaLabel,
  onCta,
  final = false,
}: {
  variant: "bottom" | "top";
  skipLabel?: string;
  onSkip?: () => void;
  headline: ReactNode;
  subtitle?: string;
  illustration?: ReactNode;
  dotIndex: number;
  dotCount: number;
  ctaLabel: string;
  onCta: () => void;
  final?: boolean;
}) {
  const { lang } = useLanguage();
  const headlineClass = lang === "he" ? `${styles.headline} ${styles.headlineHe}` : styles.headline;

  return (
    <div className={`${styles.screen} ${variant === "bottom" ? styles.screenBottom : styles.screenTop}`}>
      <div className={styles.glowNavy} />
      <div className={styles.glowBlue} />
      <div className={styles.glowPurple} />
      <div className={styles.starfield} />

      {skipLabel && onSkip && (
        <button type="button" className={styles.skip} onClick={onSkip}>
          {skipLabel}
        </button>
      )}

      <div className={styles.headlineBlock}>
        <p className={headlineClass} dir="auto">{headline}</p>
        {subtitle && <p className={styles.subtitle} dir="auto">{subtitle}</p>}
      </div>

      {illustration && <div className={styles.illustration}>{illustration}</div>}

      <div className={styles.footer}>
        <div className={styles.dots}>
          {Array.from({ length: dotCount }, (_, i) => (
            <span key={i} className={i === dotIndex ? styles.dotActive : styles.dot} />
          ))}
        </div>

        {final ? (
          <button type="button" className={styles.ctaFinal} onClick={onCta}>
            {ctaLabel}
          </button>
        ) : (
          <div className={styles.cta}>
            <span className={styles.ctaLabel}>{ctaLabel}</span>
            <button type="button" className={styles.ctaOuter} onClick={onCta} aria-label={ctaLabel}>
              <span className={styles.ctaMid}>
                <span className={styles.ctaInner}>
                  <span className={styles.ctaIcon}>
                    <ArrowRightIcon size={24} color="var(--accent-primary)" />
                  </span>
                </span>
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
