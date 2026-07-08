"use client";

import { useLanguage } from "@/components/LanguageProvider";
import OnboardingStep from "./OnboardingStep";
import styles from "./OnboardingStep.module.css";
import CaptureIllustration from "./CaptureIllustration";

export default function Step2Capture({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const { t } = useLanguage();

  return (
    <OnboardingStep
      variant="top"
      skipLabel={t.onboardingSkip}
      onSkip={onSkip}
      headline={
        <>
          {t.onboarding2HeadingBefore}
          <span className={styles.accent}>{t.onboarding2HeadingAccent}</span>
        </>
      }
      subtitle={t.onboarding2Subtitle}
      illustration={
        <CaptureIllustration
          bubble1={t.onboardingBubble1}
          bubble2={t.onboardingBubble2}
          bubble3={t.onboardingBubble3}
        />
      }
      dotIndex={1}
      dotCount={4}
      ctaLabel={t.onboardingContinue}
      onCta={onNext}
    />
  );
}
