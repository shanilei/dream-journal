"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import styles from "./OnboardingStep.module.css";
import { useLanguage } from "@/components/LanguageProvider";
import { titleVariants, illustrationVariants } from "./motion";
import { useOnboardingFooter } from "./OnboardingFooter";

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

  // Publish this step's dots/CTA into the persistent footer (mounted once
  // in OnboardingPage) instead of rendering them here, so the bar itself
  // never remounts as steps change.
  useOnboardingFooter({ dotIndex, dotCount, ctaLabel, onCta, final });

  return (
    <div className={`${styles.screen} ${variant === "bottom" ? styles.screenBottom : styles.screenTop}`}>
      {/* Always rendered (even without a skip label) so its height is
          reserved consistently — otherwise the headline below starts at a
          different Y on screens with a Skip link (step 2) vs. without one
          (step 3), since the skip button's height+margin only exists when
          it's actually in the DOM. visibility:hidden keeps the space
          without showing/allowing interaction with it. */}
      <button
        type="button"
        className={styles.skip}
        onClick={onSkip}
        style={skipLabel && onSkip ? undefined : { visibility: "hidden" }}
        tabIndex={skipLabel && onSkip ? 0 : -1}
        aria-hidden={!(skipLabel && onSkip)}
      >
        {skipLabel ?? " "}
      </button>

      <motion.div variants={titleVariants} className={styles.headlineBlock}>
        <p className={headlineClass} dir="auto">{headline}</p>
        {subtitle && <p className={styles.subtitle} dir="auto">{subtitle}</p>}
      </motion.div>

      {illustration && (
        <motion.div variants={illustrationVariants} className={styles.illustration}>
          {illustration}
        </motion.div>
      )}
    </div>
  );
}
