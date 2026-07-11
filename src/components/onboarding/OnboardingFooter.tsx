"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./OnboardingStep.module.css";
import { ArrowRightIcon } from "@/components/Icons";
import { EASE } from "./motion";

type FooterState = {
  dotIndex: number;
  dotCount: number;
  ctaLabel: string;
  onCta: () => void;
  final?: boolean;
};

// State and setter live in separate contexts: `setFooter` from useState is
// referentially stable across renders, so keeping it out of the same
// object as `footer` means the setter context value never changes —
// otherwise every setFooter call would recreate the combined value,
// re-triggering the effect below in an infinite loop.
const FooterStateContext = createContext<FooterState | null>(null);
const FooterSetterContext = createContext<(footer: FooterState | null) => void>(() => {});

export function OnboardingFooterProvider({ children }: { children: ReactNode }) {
  const [footer, setFooter] = useState<FooterState | null>(null);
  return (
    <FooterSetterContext.Provider value={setFooter}>
      <FooterStateContext.Provider value={footer}>{children}</FooterStateContext.Provider>
    </FooterSetterContext.Provider>
  );
}

// Called by each step to publish its dots/CTA into the persistent footer
// instead of rendering its own — see OnboardingFooter below for why.
export function useOnboardingFooter(state: FooterState) {
  const setFooter = useContext(FooterSetterContext);
  const { dotIndex, dotCount, ctaLabel, onCta, final } = state;
  useEffect(() => {
    setFooter({ dotIndex, dotCount, ctaLabel, onCta, final });
    return () => setFooter(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFooter, dotIndex, dotCount, ctaLabel, onCta, final]);
}

// Mounted once for the whole flow, next to OnboardingBackground — the dots
// row and CTA never remount between steps 1-3. Only the active dot's
// width/position animates (via layout animation) and the CTA content
// crossfades, instead of the whole bar fading out and sliding back in on
// every step change. `onDotClick` is passed straight from OnboardingPage
// (not via context) since only the page knows how to map a dot index back
// to a phase — it lets a dot jump the flow forward or backward directly.
export default function OnboardingFooter({
  onDotClick,
}: {
  onDotClick?: (index: number) => void;
}) {
  const footer = useContext(FooterStateContext);

  return (
    <AnimatePresence>
      {footer && (
        <motion.div
          className={`${styles.footer} ${styles.footerBar}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <div className={styles.dots}>
            {Array.from({ length: footer.dotCount }, (_, i) => (
              <button
                key={i}
                type="button"
                className={styles.dotHit}
                onClick={() => onDotClick?.(i)}
                aria-label={`Go to step ${i + 1}`}
                aria-current={i === footer.dotIndex}
              >
                <motion.span
                  layout
                  transition={{ duration: 0.5, ease: EASE }}
                  className={i === footer.dotIndex ? styles.dotActive : styles.dot}
                />
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {footer.final ? (
              <motion.button
                key="final"
                type="button"
                className={styles.ctaFinal}
                onClick={footer.onCta}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                {footer.ctaLabel}
              </motion.button>
            ) : (
              <motion.div
                key="arrow"
                className={styles.cta}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <span className={styles.ctaLabel}>{footer.ctaLabel}</span>
                <button
                  type="button"
                  className={styles.ctaRound}
                  onClick={footer.onCta}
                  aria-label={footer.ctaLabel}
                >
                  <span className={styles.ctaIcon}>
                    <ArrowRightIcon size={24} color="var(--accent-primary)" />
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
