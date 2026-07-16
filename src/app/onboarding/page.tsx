"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ONBOARDING_SESSION_KEY, markOnboarded } from "@/lib/onboarding";
import OnboardingBackground from "@/components/onboarding/OnboardingBackground";
import OnboardingFooter, { OnboardingFooterProvider } from "@/components/onboarding/OnboardingFooter";
import { screenVariants } from "@/components/onboarding/motion";
import SplashScreen from "@/components/onboarding/SplashScreen";
import LanguagePickerScreen from "@/components/onboarding/LanguagePickerScreen";
import Step1Welcome from "@/components/onboarding/Step1Welcome";
import Step2Capture from "@/components/onboarding/Step2Capture";
import Step3Patterns from "@/components/onboarding/Step3Patterns";
import DebugErrorBoundary from "@/components/onboarding/DebugErrorBoundary";
import styles from "./onboarding.module.css";

type Phase = "splash" | "language" | 1 | 2 | 3;

// TEMPORARY — capturing a real iPhone /onboarding crash that couldn't be
// reproduced in Chromium. Safe to delete this whole block (and the
// useEffect below that installs it) once the failure is captured.
function reportGlobalError(payload: Record<string, unknown>) {
  const body = {
    ...payload,
    pathname: window.location.pathname,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
  console.error("[onboarding-debug]", body);
  fetch("/api/debug-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}

export default function OnboardingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("splash");

  // TEMPORARY — see reportGlobalError above. Scoped to this page only:
  // listeners are added on mount and removed on unmount, so nothing
  // leaks to other routes.
  useEffect(() => {
    function onError(event: ErrorEvent) {
      reportGlobalError({
        source: "window.onerror",
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    }
    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      reportGlobalError({
        source: "unhandledrejection",
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  function finish() {
    try {
      sessionStorage.setItem(ONBOARDING_SESSION_KEY, "1");
    } catch {
      // private browsing or storage disabled — just continue
    }
    markOnboarded();
    router.push("/record");
  }

  return (
    // TEMPORARY DebugErrorBoundary — see the file for why, and note it
    // can only catch errors thrown by *this* subtree, not by ancestors
    // like ThemeProvider/LanguageProvider in layout.tsx (those are
    // covered by the window.onerror/unhandledrejection listeners above
    // instead, since a React boundary can't catch its own parents).
    <DebugErrorBoundary>
      <div className={`${styles.shell} lockedScreen`}>
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
    </DebugErrorBoundary>
  );
}
