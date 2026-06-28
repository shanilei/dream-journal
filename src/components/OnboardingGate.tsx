"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ONBOARDING_SESSION_KEY } from "./OnboardingScreen";
import { LANGUAGE_CHOSEN_KEY } from "./LanguageProvider";

export default function OnboardingGate() {
  const router = useRouter();

  useEffect(() => {
    let languageChosen = true;
    try {
      languageChosen = localStorage.getItem(LANGUAGE_CHOSEN_KEY) === "1";
    } catch {
      // private browsing or storage disabled — skip the language splash rather than block entry
    }
    if (!languageChosen) {
      router.replace("/language-splash");
      return;
    }

    let onboarded = true;
    try {
      onboarded = sessionStorage.getItem(ONBOARDING_SESSION_KEY) === "1";
    } catch {
      // private browsing or storage disabled — skip onboarding rather than block entry
    }
    if (!onboarded) router.replace("/onboarding");
  }, [router]);

  return null;
}
