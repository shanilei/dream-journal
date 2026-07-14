"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./YourJourneyScreen.module.css";
import BottomNav from "./BottomNav";
import SettingsSheet from "./SettingsSheet";
import AnimatedNumber from "./AnimatedNumber";
import { useLanguage } from "./LanguageProvider";
import { translateMood } from "@/i18n/translations";
import {
  SettingsIcon,
  BoltIcon,
  FlameIcon,
  InfoIcon,
  TrendIcon,
  CloudMoonIcon,
  SmileIcon,
  NightmareIcon,
} from "./Icons";

// One easing curve, one "step" (opacity + 8px up), reused everywhere via
// variant propagation instead of hand-tuned per-element delays — a page
// doesn't just appear, it assembles: header first, then each section's
// children stagger in on top of it. Nesting a stagger container inside
// a fade-up item (e.g. .statsCard inside .content, .patternRow inside
// its section) works because Framer propagates "hidden"/"show" down the
// whole tree by variant name, so the sequencing stays fully declarative.
const EASE = [0.22, 1, 0.36, 1] as const;

export type PatternCard = {
  label: string;
  description: string;
  image?: string;
  cardType?: "symbol" | "emotion" | "keyword";
};

export type JourneyStats = {
  totalDreams: number;
  sinceDate: string;
  sinceDateHe: string;
  streak: number;
  streakProgress: number;
  dreamsThisMonth: number;
  dreamsThisMonthDelta: number;
  dreamsThisWeek: number;
  dreamsThisWeekDelta: number;
  avgMoodPercent: number;
  nightmarePercent: number;
  patternCards: PatternCard[];
};

const descKeyMap: Record<string, "mostCommonSymbolDesc" | "mostCommonEmotionDesc" | "recurringThemeDesc"> = {
  "Most common symbol": "mostCommonSymbolDesc",
  "Most common emotion": "mostCommonEmotionDesc",
  "Recurring theme": "recurringThemeDesc",
};

export default function YourJourneyScreen({ stats }: { stats: JourneyStats }) {
  const [showSettings, setShowSettings] = useState(false);
  const { lang, t } = useLanguage();
  const isHe = lang === "he";
  const reduceMotion = useReducedMotion();

  // staggerChildren/delayChildren kept small (0.05/0.03) since this same
  // container nests three levels deep (content → statsCard → statsCol,
  // content → section → patternRow/trendList) — each nested container
  // restarts its own stagger timer once its turn comes, so the totals
  // compound. Tuned so the full assembly (header through trends) lands
  // inside the 500–700ms target instead of dragging on.
  const staggerContainer = {
    hidden: {},
    show: {
      transition: reduceMotion ? {} : { staggerChildren: 0.05, delayChildren: 0.03 },
    },
  };

  const fadeUp = {
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.3, ease: EASE },
    },
  };

  function greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return t.goodMorning;
    if (h < 18) return t.goodAfternoon;
    return t.goodEvening;
  }

  function monthDeltaSubtitle(delta: number, scope: "month" | "week"): string {
    if (isHe) {
      if (delta > 0) return `${delta} יותר מה${scope === "month" ? "חודש" : "שבוע"} הקודם`;
      if (delta < 0) return `${Math.abs(delta)} פחות מה${scope === "month" ? "חודש" : "שבוע"} הקודם`;
      return `כמו ה${scope === "month" ? "חודש" : "שבוע"} הקודם`;
    }
    const prev = scope === "month" ? "last month" : "last week";
    if (delta > 0) return `${delta} more than ${prev}`;
    if (delta < 0) return `${Math.abs(delta)} fewer than ${prev}`;
    return `Same as ${prev}`;
  }

  const trendRows = [
    {
      // First row reads as the primary/emphasized stat in the design
      // (Figma 1494:10394) — brighter icon to match its brighter text.
      icon: <TrendIcon size={18} color="#ffffff" />,
      title: t.dreamsThisMonth,
      subtitle: monthDeltaSubtitle(stats.dreamsThisMonthDelta, "month"),
      numericValue: stats.dreamsThisMonth,
      suffix: "",
    },
    {
      icon: <CloudMoonIcon size={18} color="rgba(255,255,255,0.7)" />,
      title: t.dreamsThisWeek,
      subtitle: monthDeltaSubtitle(stats.dreamsThisWeekDelta, "week"),
      numericValue: stats.dreamsThisWeek,
      suffix: "",
    },
    {
      icon: <SmileIcon size={18} color="rgba(255,255,255,0.7)" />,
      title: t.avgMood,
      subtitle: t.morePositive,
      numericValue: stats.avgMoodPercent,
      suffix: "%",
    },
    {
      icon: <NightmareIcon size={18} color="rgba(255,255,255,0.7)" />,
      title: t.nightmares,
      subtitle: t.decreased,
      numericValue: stats.nightmarePercent,
      suffix: "%",
    },
  ];

  const sinceDate = isHe ? stats.sinceDateHe : stats.sinceDate;

  return (
    <div className={styles.screen}>
      {/* Background — same nebula system as Gallery/Record/Type */}
      <div className={`${styles.nebula} ${styles.nebulaBlue}`} />
      <div className={`${styles.nebula} ${styles.nebulaPurple}`} />
      <div className={`${styles.nebula} ${styles.nebulaCyan}`} />

      <motion.div
        className={styles.content}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {/* Header: gear icon aligned to edge, then title full-width */}
        <motion.div className={styles.headerGroup} variants={fadeUp}>
          <div className={styles.titleBlock}>
            <div className={styles.gearRow}>
              <button
                type="button"
                className={styles.settingsBtn}
                aria-label="Settings"
                onClick={() => setShowSettings(true)}
              >
                <SettingsIcon size={16} color="rgba(255,255,255,0.85)" />
              </button>
            </div>
            <h1 className={`${styles.title} ${isHe ? styles.titleHe : ""}`}>{t.journeyTitle}</h1>
          </div>
          <div className={`${styles.subtitle} ${isHe ? styles.subtitleHe : ""}`}>
            {isHe ? (
              <>
                <p dir="rtl">{`${greeting()}, ${t.journeyUser}.`}</p>
                <p dir="rtl">{t.journeySubtitle}</p>
              </>
            ) : (
              <>
                <p dir="ltr">{`${greeting()}, ${t.journeyUser}`}</p>
                <p dir="ltr">{t.journeySubtitle}</p>
              </>
            )}
          </div>
        </motion.div>

        {/* Stats card — Figma 1494:10499 / 1501:10823: icon+label sit
            together in a small row above the big number, instead of a
            big badge beside it. Its two columns stagger in individually
            (variants propagate from the outer container) instead of the
            whole card appearing as one block. */}
        <motion.div className={styles.statsCard} variants={staggerContainer}>
          {/* First column: total dreams */}
          <motion.div className={styles.statsCol} variants={fadeUp}>
            <div className={styles.statsLabelRow}>
              <BoltIcon size={15} color="rgba(255,255,255,0.7)" />
              <span className={`${styles.statsColLabel} ${isHe ? styles.statsLabelHe : ""}`}>{t.dreamsRecord}</span>
            </div>
            <AnimatedNumber value={stats.totalDreams} delay={0.15} className={styles.statsNum} />
            <div className={styles.statsDividerH} />
            <p className={`${styles.statsCaption} ${isHe ? styles.statsLabelHe : ""}`}>
              {t.since ? `${t.since} ${sinceDate}` : sinceDate}
            </p>
          </motion.div>

          {/* Vertical divider */}
          <div className={styles.statsDividerV} />

          {/* Second column: streak */}
          <motion.div className={styles.statsCol} variants={fadeUp}>
            <div className={styles.statsLabelRow}>
              <FlameIcon size={16} color="rgba(255,255,255,0.7)" />
              <span className={`${styles.statsColLabel} ${isHe ? styles.statsLabelHe : ""}`}>{t.dayStreak}</span>
            </div>
            <AnimatedNumber value={stats.streak} delay={0.2} className={styles.statsNum} />
            <div className={styles.statsDividerH} />
            <div className={styles.progressTrack}>
              <motion.div
                className={styles.progressBar}
                initial={{ width: reduceMotion ? `${Math.round(stats.streakProgress * 100)}%` : 0 }}
                animate={{ width: `${Math.round(stats.streakProgress * 100)}%` }}
                transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.2, ease: EASE }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Dream Pattern — thumbnails fade in with their own small
            stagger, same variant propagation as everything else. */}
        {stats.patternCards.length > 0 && (
          <motion.section className={styles.section} variants={fadeUp}>
            <div className={styles.sectionHeader}>
              <span className={`${styles.sectionLabel} ${isHe ? styles.sectionLabelHe : ""}`}>{t.dreamPattern}</span>
              <InfoIcon size={15} />
            </div>
            <motion.div className={styles.patternRow} variants={staggerContainer}>
              {stats.patternCards.map((card, i) => {
                const descKey = descKeyMap[card.description];
                const desc = descKey ? t[descKey] : card.description;
                const cardLabel =
                  isHe && card.cardType === "emotion"
                    ? translateMood(card.label, "he")
                    : card.label;
                return (
                  <motion.div key={i} className={styles.patternCard} variants={fadeUp}>
                    <div className={styles.patternImageWrap}>
                      {card.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={card.image} alt={cardLabel} className={styles.patternImg} />
                      ) : (
                        <div className={styles.patternImgPlaceholder} />
                      )}
                    </div>
                    <div className={styles.patternInfo}>
                      <p className={`${styles.patternLabel} ${isHe ? styles.patternLabelHe : ""}`}>{cardLabel}</p>
                      <p className={`${styles.patternDesc} ${isHe ? styles.patternDescHe : ""}`}>{desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.section>
        )}

        {/* Trends */}
        <motion.section className={styles.section} variants={fadeUp}>
          <div className={styles.sectionHeader}>
            <span className={`${styles.sectionLabel} ${isHe ? styles.sectionLabelHe : ""}`}>{t.trendsInDreams}</span>
            <InfoIcon size={15} />
          </div>
          <motion.div className={styles.trendList} variants={staggerContainer}>
            {trendRows.map((row, i) => (
              <motion.div key={i} className={`${styles.trendCard} ${i === 0 ? styles.trendCardPrimary : ""}`} variants={fadeUp}>
                <div className={styles.trendIcon}>{row.icon}</div>
                <div className={styles.trendText}>
                  <p className={`${styles.trendTitle} ${isHe ? styles.trendTitleHe : ""}`}>{row.title}</p>
                  <p className={`${styles.trendSubtitle} ${isHe ? styles.trendSubtitleHe : ""}`}>{row.subtitle}</p>
                </div>
                <AnimatedNumber
                  value={row.numericValue}
                  format={(n) => `${n}${row.suffix}`}
                  delay={0.25}
                  className={styles.trendValue}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      </motion.div>

      <BottomNav active="user" />

      {showSettings && (
        <SettingsSheet onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
