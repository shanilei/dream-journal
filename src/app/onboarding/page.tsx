"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ONBOARDING_SESSION_KEY } from "@/components/OnboardingScreen";
import OnboardingBackground from "@/components/onboarding/OnboardingBackground";
import OnboardingFooter, { OnboardingFooterProvider } from "@/components/onboarding/OnboardingFooter";
import { screenVariants } from "@/components/onboarding/motion";
import SplashScreen from "@/components/onboarding/SplashScreen";
import LanguagePickerScreen from "@/components/onboarding/LanguagePickerScreen";
import Step1Welcome from "@/components/onboarding/Step1Welcome";
import Step2Capture from "@/components/onboarding/Step2Capture";
import Step3Patterns from "@/components/onboarding/Step3Patterns";
import styles from "./onboarding.module.css";

type Phase = "splash" | "language" | 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("splash");

  function finish() {
    try {
      sessionStorage.setItem(ONBOARDING_SESSION_KEY, "1");
    } catch {
      // private browsing or storage disabled — just continue
    }
    router.push("/record");
  }

  return (
    <div className={styles.shell}>
      {/* Mounted once for the whole flow — the starfield/glow never resets
          or hard-cuts as `phase` changes underneath it. */}
      <OnboardingBackground />

      <OnboardingFooterProvider>
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            variants={screenVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            style={{ position: "relative", zIndex: 1, height: "100%" }}
          >
            {phase === "splash" && <SplashScreen onDone={() => setPhase("language")} />}
            {phase === "language" && <LanguagePickerScreen onContinue={() => setPhase(1)} />}
            {phase === 1 && <Step1Welcome onNext={() => setPhase(2)} />}
            {phase === 2 && <Step2Capture onNext={() => setPhase(3)} onSkip={finish} />}
            {phase === 3 && <Step3Patterns onFinish={finish} />}
          </motion.div>
        </AnimatePresence>

        {/* Mounted once alongside the background — dots/CTA persist across
            steps 1-3 instead of remounting with each screen. */}
        <OnboardingFooter
          onDotClick={(i) => {
            if (i === 0 || i === 1 || i === 2) setPhase((i + 1) as Phase);
          }}
        />
      </OnboardingFooterProvider>
    </div>
  );
}
