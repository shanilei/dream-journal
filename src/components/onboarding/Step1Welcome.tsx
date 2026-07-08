"use client";

import { useLanguage } from "@/components/LanguageProvider";
import OnboardingStep from "./OnboardingStep";
import styles from "./OnboardingStep.module.css";

export default function Step1Welcome({ onNext }: { onNext: () => void }) {
  const { t } = useLanguage();

  return (
    <OnboardingStep
      variant="bottom"
      headline={
        <>
          {t.onboarding1HeadingBefore}
          <span className={styles.accent}>{t.onboarding1HeadingAccent1}</span>
          {t.onboarding1HeadingMiddle}
          <span className={styles.accent}>{t.onboarding1HeadingAccent2}</span>
        </>
      }
      dotIndex={0}
      dotCount={4}
      ctaLabel={t.onboardingContinue}
      onCta={onNext}
    />
  );
}
