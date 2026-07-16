"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ArrowRightIcon } from "@/components/Icons";
import { titleVariants, visualVariants, footerVariants, EASE } from "./motion";
import styles from "./LanguagePickerScreen.module.css";

// Module scope, not component state — persists for the life of the page
// (survives this component unmounting/remounting, e.g. navigating back
// to this screen via the footer dots), so only a genuine first-ever
// appearance after the splash gets the simplified reveal below; a later
// return visit looks like any other phase transition, with the normal
// choreography untouched.
let hasEverRevealedLanguageScreen = false;

// First reveal only: opacity-only, no translateY, no scale, short and
// identical on all three pieces so they appear together rather than
// staggered — nothing here can visibly "jump" even if it renders
// choppily on a slower device, since there's no position/size to jump.
const firstRevealFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.25, ease: EASE },
};

export default function LanguagePickerScreen({ onContinue }: { onContinue: () => void }) {
  const { lang, setLang, t, resolved, fontReady } = useLanguage();

  // Gates only the *first* reveal — resolved (language string known)
  // AND fontReady (the font that reveal needs is loaded) — both owned by
  // LanguageProvider, which starts loading the active language's font at
  // app mount, during the splash screen, well before this screen exists.
  // We only latch onto the *first* time both are true and never hide
  // content again: an explicit tap on English/Hebrew afterward is
  // handled entirely by the key={lang} AnimatePresence below, with its
  // existing animation, even if that *new* language's font is still
  // loading in the background — switching never waits on a font check.
  const [everReady, setEverReady] = useState(false);
  useEffect(() => {
    if (resolved && fontReady && !everReady) setEverReady(true);
  }, [resolved, fontReady, everReady]);

  // Fixed once, at this instance's first render — true only if the
  // language screen has never appeared before in this session. A manual
  // English/Hebrew switch afterward is completely unaffected by this:
  // it's handled entirely by the key={lang} AnimatePresence below,
  // independent of which entrance this instance used.
  const [isFirstReveal] = useState(() => !hasEverRevealedLanguageScreen);
  useEffect(() => {
    hasEverRevealedLanguageScreen = true;
  }, []);

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        {/* Nothing language-dependent renders until everReady — the
            first real reveal is already in the correct language AND the
            correct font, in one commit, so heading/subtitle/buttons/CTA
            all appear together instead of English (or the fallback font)
            showing first and correcting a moment later. Since this is
            also the *first* child AnimatePresence ever sees, initial=
            {false} correctly treats it as a mount, not a switch — the
            exit/enter animation below only plays for an explicit tap on
            English/Hebrew afterward.

            The outer three wrappers (title/options/cta) use a plain
            opacity fade instead of the normal titleVariants/
            visualVariants/footerVariants choreography on a genuine first
            reveal only (isFirstReveal) — a return visit to this screen
            (e.g. via the footer dots) still gets the full, normal
            entrance. Either way the *inner* headingBlock AnimatePresence
            above is untouched, so a manual language switch always keeps
            its existing fade+slide regardless of which entrance this
            instance used. */}
        {everReady && (
          <>
            <motion.div {...(isFirstReveal ? firstRevealFade : { variants: titleVariants })}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={lang}
                  className={styles.headingBlock}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <h1 className={styles.heading} dir="auto">
                    {t.langPickerHeadingBefore}
                    <span className={styles.accent}>{t.langPickerHeadingAccent}</span>
                    {t.langPickerHeadingAfter}
                  </h1>
                  <p className={styles.subtitle} dir="auto">{t.langPickerSubtitle}</p>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <motion.div {...(isFirstReveal ? firstRevealFade : { variants: visualVariants })} className={styles.options}>
              <button
                type="button"
                className={`${styles.option} ${styles.optionEnglish} ${lang === "en" ? styles.optionActive : ""}`}
                onClick={() => setLang("en")}
              >
                {t.langNameEnglish}
              </button>
              <button
                type="button"
                className={`${styles.option} ${styles.optionHebrew} ${lang === "he" ? styles.optionActive : ""}`}
                onClick={() => setLang("he")}
              >
                {t.langNameHebrew}
              </button>
            </motion.div>

            <motion.button {...(isFirstReveal ? firstRevealFade : { variants: footerVariants })} type="button" className={styles.cta} onClick={onContinue}>
              <span className={styles.ctaLabel}>{t.langPickerCta}</span>
              <span className={styles.ctaIcon}>
                <ArrowRightIcon size={24} color="var(--accent-primary)" />
              </span>
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}
