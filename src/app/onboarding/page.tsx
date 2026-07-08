"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ONBOARDING_SESSION_KEY } from "@/components/OnboardingScreen";
import SplashScreen from "@/components/onboarding/SplashScreen";
import LanguagePickerScreen from "@/components/onboarding/LanguagePickerScreen";
import Step1Welcome from "@/components/onboarding/Step1Welcome";
import Step2Capture from "@/components/onboarding/Step2Capture";
import Step3Patterns from "@/components/onboarding/Step3Patterns";

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
    <>
      {/* Splash must fully fade out before the language picker fades in —
          sequential (mode="wait") is intentional here, not just cosmetic. */}
      {(phase === "splash" || phase === "language") && (
        <AnimatePresence mode="wait">
          {phase === "splash" && (
            <motion.div key="splash" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <SplashScreen onDone={() => setPhase("language")} />
            </motion.div>
          )}
          {phase === "language" && (
            <motion.div
              key="language"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <LanguagePickerScreen onContinue={() => setPhase(1)} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Steps swap instantly — each screen's own CSS handles a quick
          entrance fade, so there's no blank gap between them. */}
      {phase === 1 && <Step1Welcome onNext={() => setPhase(2)} />}
      {phase === 2 && <Step2Capture onNext={() => setPhase(3)} onSkip={finish} />}
      {phase === 3 && <Step3Patterns onFinish={finish} />}
    </>
  );
}
