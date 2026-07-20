"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "./LanguageProvider";
import OnboardingBackground from "./onboarding/OnboardingBackground";
import { GoogleIcon } from "./Icons";
import styles from "./SignInScreen.module.css";

export default function SignInScreen() {
  const { t, lang } = useLanguage();
  const searchParams = useSearchParams();
  const hadError = searchParams.get("error") === "1";
  const [loading, setLoading] = useState(false);

  async function handleContinueWithGoogle() {
    if (loading) return;
    setLoading(true);
    const supabase = createClient();
    // redirectTo is derived from window.location.origin, not hardcoded —
    // this is what makes the same code correctly return to localhost in
    // dev and the real Vercel domain in production without an env var or
    // config value to keep in sync. /auth/callback (see that route)
    // exchanges the code and lands on /gallery by default.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/gallery` },
    });
    if (error) setLoading(false);
    // On success the browser is about to navigate away to Google's own
    // sign-in page, so there's nothing further to do here.
  }

  return (
    <div className={styles.screen} dir={lang === "he" ? "rtl" : "ltr"}>
      <OnboardingBackground />
      <div className={styles.content}>
        <div className={styles.logoWindow}>
          <img src="/images/onboarding/lucid-logo.png" alt="Lucid" className={styles.logo} />
        </div>
        <p className={styles.subtitle}>{t.signInSubtitle}</p>
        <p className={styles.explainer}>{t.signInExplainer}</p>

        {hadError && <p className={styles.error}>{t.signInError}</p>}

        <button type="button" className={styles.cta} onClick={handleContinueWithGoogle} disabled={loading}>
          <span className={styles.ctaIcon}>
            <GoogleIcon size={18} />
          </span>
          <span className={styles.ctaLabel}>{t.continueWithGoogle}</span>
        </button>
      </div>
    </div>
  );
}
