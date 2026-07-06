"use client";

import { useState } from "react";
import LucidIntroAnimation from "@/components/LucidIntroAnimation";
import OnboardingScreen from "@/components/OnboardingScreen";

export default function OnboardingPage() {
  const [introDone, setIntroDone] = useState(false);

  if (!introDone) {
    return <LucidIntroAnimation onComplete={() => setIntroDone(true)} />;
  }
  return <OnboardingScreen />;
}
