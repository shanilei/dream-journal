"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ArrowRightIcon } from "@/components/Icons";
import { titleVariants, visualVariants, footerVariants, EASE } from "./motion";
import styles from "./LanguagePickerScreen.module.css";

export default function LanguagePickerScreen({ onContinue }: { onContinue: () => void }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        <motion.div variants={titleVariants}>
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

        <motion.div variants={visualVariants} className={styles.options}>
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

        <motion.button variants={footerVariants} type="button" className={styles.cta} onClick={onContinue}>
          <span className={styles.ctaLabel}>{t.langPickerCta}</span>
          <span className={styles.ctaIcon}>
            <ArrowRightIcon size={24} color="var(--accent-primary)" />
          </span>
        </motion.button>
      </div>
    </div>
  );
}
