"use client";

import { useLanguage } from "@/components/LanguageProvider";
import OnboardingStep from "./OnboardingStep";
import styles from "./OnboardingStep.module.css";
import PatternsIllustration from "./PatternsIllustration";

export default function Step3Patterns({ onFinish }: { onFinish: () => void }) {
  const { t } = useLanguage();

  return (
    <OnboardingStep
      variant="top"
      headline={
        <>
          {t.onboarding3HeadingBefore}
          <span className={styles.accent}>{t.onboarding3HeadingAccent}</span>
          {t.onboarding3HeadingAfter}
        </>
      }
      subtitle={t.onboarding3Subtitle}
      illustration={
        <PatternsIllustration
          waterLabel={t.onboardingCardWaterLabel}
          waterSub={t.onboardingCardWaterSub}
          homeLabel={t.onboardingCardHomeLabel}
          homeSub={t.onboardingCardHomeSub}
          tagSymbol={t.onboardingTagSymbol}
          tagWords={t.onboardingTagWords}
        />
      }
      dotIndex={2}
      dotCount={3}
      ctaLabel={t.onboardingStartDreaming}
      onCta={onFinish}
      final
    />
  );
}
