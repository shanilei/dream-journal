"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import styles from "./OnboardingStep.module.css";
import { ArrowRightIcon } from "@/components/Icons";
import { useLanguage } from "@/components/LanguageProvider";
import { titleVariants, illustrationVariants, footerVariants } from "./motion";

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
      {skipLabel && onSkip && (
        <button type="button" className={styles.skip} onClick={onSkip}>
          {skipLabel}
        </button>
      )}

      <motion.div variants={titleVariants} className={styles.headlineBlock}>
        <p className={headlineClass} dir="auto">{headline}</p>
        {subtitle && <p className={styles.subtitle} dir="auto">{subtitle}</p>}
      </motion.div>

      {illustration && (
        <motion.div variants={illustrationVariants} className={styles.illustration}>
          {illustration}
        </motion.div>
      )}

      <motion.div variants={footerVariants} className={styles.footer}>
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
            <button type="button" className={styles.ctaRound} onClick={onCta} aria-label={ctaLabel}>
              <span className={styles.ctaIcon}>
                <ArrowRightIcon size={24} color="var(--accent-primary)" />
              </span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
