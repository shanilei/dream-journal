"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ArrowRightIcon } from "@/components/Icons";
import type { Lang } from "@/i18n/translations";
import styles from "./LanguagePickerScreen.module.css";

export default function LanguagePickerScreen({ onContinue }: { onContinue: () => void }) {
  const { lang, setLang, t } = useLanguage();

  const other: Lang = lang === "en" ? "he" : "en";
  const otherLabel = other === "en" ? t.langNameEnglish : t.langNameHebrew;
  const selectedLabel = lang === "en" ? t.langNameEnglish : t.langNameHebrew;

  return (
    <div className={styles.screen}>
      <div className={styles.glowNavy} />
      <div className={styles.glowBlue} />
      <div className={styles.glowPurple} />
      <div className={styles.starfield} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={lang}
          className={styles.content}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div className={styles.headingBlock}>
            <h1 className={styles.heading} dir="auto">
              {t.langPickerHeadingBefore}
              <span className={styles.accent}>{t.langPickerHeadingAccent}</span>
              {t.langPickerHeadingAfter}
            </h1>
            <p className={styles.subtitle} dir="auto">{t.langPickerSubtitle}</p>
          </div>

          <div className={styles.options}>
            <p className={styles.optionSelected}>
              <span className={styles.paren}>(</span>
              <span className={`${styles.optionSelectedLabel} ${lang === "he" ? styles.ploniWord : ""}`}>
                {selectedLabel}
              </span>
              <span className={styles.paren}>)</span>
            </p>
            <button
              type="button"
              className={`${styles.optionOther} ${other === "he" ? styles.ploniWord : ""}`}
              onClick={() => setLang(other)}
            >
              {otherLabel}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <button type="button" className={styles.cta} onClick={onContinue}>
        <span className={styles.ctaLabel}>{t.langPickerCta}</span>
        <span className={styles.ctaIcon}>
          <ArrowRightIcon size={24} color="var(--accent-primary)" />
        </span>
      </button>
    </div>
  );
}
