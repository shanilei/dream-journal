"use client";

import { useState } from "react";
import styles from "./YourJourneyScreen.module.css";
import BottomNav from "./BottomNav";
import SettingsSheet from "./SettingsSheet";
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
      value: String(stats.dreamsThisMonth),
    },
    {
      icon: <CloudMoonIcon size={18} color="rgba(255,255,255,0.7)" />,
      title: t.dreamsThisWeek,
      subtitle: monthDeltaSubtitle(stats.dreamsThisWeekDelta, "week"),
      value: String(stats.dreamsThisWeek),
    },
    {
      icon: <SmileIcon size={18} color="rgba(255,255,255,0.7)" />,
      title: t.avgMood,
      subtitle: t.morePositive,
      value: `${stats.avgMoodPercent}%`,
    },
    {
      icon: <NightmareIcon size={18} color="rgba(255,255,255,0.7)" />,
      title: t.nightmares,
      subtitle: t.decreased,
      value: `${stats.nightmarePercent}%`,
    },
  ];

  const sinceDate = isHe ? stats.sinceDateHe : stats.sinceDate;

  return (
    <div className={styles.screen}>
      {/* Background — same nebula system as Gallery/Record/Type */}
      <div className={`${styles.nebula} ${styles.nebulaBlue}`} />
      <div className={`${styles.nebula} ${styles.nebulaPurple}`} />
      <div className={`${styles.nebula} ${styles.nebulaCyan}`} />

      <div className={styles.content}>
        {/* Header: gear icon aligned to edge, then title full-width */}
        <div className={styles.headerGroup}>
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
        </div>

        {/* Stats card — Figma 1494:10499 / 1501:10823: icon+label sit
            together in a small row above the big number, instead of a
            big badge beside it. */}
        <div className={styles.statsCard}>
          {/* First column: total dreams */}
          <div className={styles.statsCol}>
            <div className={styles.statsLabelRow}>
              <BoltIcon size={15} color="rgba(255,255,255,0.7)" />
              <span className={`${styles.statsColLabel} ${isHe ? styles.statsLabelHe : ""}`}>{t.dreamsRecord}</span>
            </div>
            <span className={styles.statsNum}>{stats.totalDreams}</span>
            <div className={styles.statsDividerH} />
            <p className={`${styles.statsCaption} ${isHe ? styles.statsLabelHe : ""}`}>
              {t.since ? `${t.since} ${sinceDate}` : sinceDate}
            </p>
          </div>

          {/* Vertical divider */}
          <div className={styles.statsDividerV} />

          {/* Second column: streak */}
          <div className={styles.statsCol}>
            <div className={styles.statsLabelRow}>
              <FlameIcon size={16} color="rgba(255,255,255,0.7)" />
              <span className={`${styles.statsColLabel} ${isHe ? styles.statsLabelHe : ""}`}>{t.dayStreak}</span>
            </div>
            <span className={styles.statsNum}>{stats.streak}</span>
            <div className={styles.statsDividerH} />
            <div className={styles.progressTrack}>
              <div
                className={styles.progressBar}
                style={{ width: `${Math.round(stats.streakProgress * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dream Pattern */}
        {stats.patternCards.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={`${styles.sectionLabel} ${isHe ? styles.sectionLabelHe : ""}`}>{t.dreamPattern}</span>
              <InfoIcon size={15} />
            </div>
            <div className={styles.patternRow}>
              {stats.patternCards.map((card, i) => {
                const descKey = descKeyMap[card.description];
                const desc = descKey ? t[descKey] : card.description;
                const cardLabel =
                  isHe && card.cardType === "emotion"
                    ? translateMood(card.label, "he")
                    : card.label;
                return (
                  <div key={i} className={styles.patternCard}>
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
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Trends */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={`${styles.sectionLabel} ${isHe ? styles.sectionLabelHe : ""}`}>{t.trendsInDreams}</span>
            <InfoIcon size={15} />
          </div>
          <div className={styles.trendList}>
            {trendRows.map((row, i) => (
              <div key={i} className={`${styles.trendCard} ${i === 0 ? styles.trendCardPrimary : ""}`}>
                <div className={styles.trendIcon}>{row.icon}</div>
                <div className={styles.trendText}>
                  <p className={`${styles.trendTitle} ${isHe ? styles.trendTitleHe : ""}`}>{row.title}</p>
                  <p className={`${styles.trendSubtitle} ${isHe ? styles.trendSubtitleHe : ""}`}>{row.subtitle}</p>
                </div>
                <span className={styles.trendValue}>{row.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomNav active="user" />

      {showSettings && (
        <SettingsSheet onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
