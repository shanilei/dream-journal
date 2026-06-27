"use client";

import styles from "@/app/home.module.css";
import BottomNav from "@/components/BottomNav";
import DreamCardStack from "@/components/DreamCardStack";
import GlassEffect from "@/components/GlassEffect";
import OnboardingGate from "@/components/OnboardingGate";
import { FilterIcon, LayoutGalleryIcon, TableChartIcon } from "@/components/Icons";
import { useLanguage } from "@/components/LanguageProvider";

const CATEGORIES = [
  { label: "Fear", count: 220 },
  { label: "Love", count: 150 },
  { label: "Confusion", count: 300 },
  { label: "Confusion", count: 300 },
];

type Card = {
  id: string;
  image: string;
  mood: string;
  date: string;
  time: string;
};

export default function HomeScreenClient({ cards }: { cards: Card[] }) {
  const { t } = useLanguage();

  return (
    <div className={styles.screen}>
      <OnboardingGate />
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <button type="button" className={styles.pillBtn} aria-label="Table view">
            <GlassEffect fill size={48} />
            <span className={styles.iconLayer}>
              <TableChartIcon size={16} color="currentColor" />
            </span>
          </button>
          <button type="button" className={styles.pillBtn} aria-label="Gallery view">
            <GlassEffect fill size={48} />
            <span className={styles.iconLayer}>
              <LayoutGalleryIcon size={16} color="currentColor" />
            </span>
          </button>
        </div>
        <button type="button" className={styles.pillBtn} aria-label="Filter">
          <GlassEffect fill size={48} />
          <span className={styles.iconLayer}>
            <FilterIcon size={16} color="currentColor" />
          </span>
        </button>
      </div>

      <p className={styles.heading}>{t.latestDreams}</p>

      <DreamCardStack cards={cards} />

      <div className={styles.byType}>
        <div className={styles.byTypeHeaderRow}>
          <p className={styles.byTypeHeading}>{t.byType}</p>
          <a className={styles.seeAll} href="#">
            {t.seeAll}
          </a>
        </div>
        <div className={styles.categoryRow}>
          {CATEGORIES.map((cat, i) => (
            <div key={i} className={styles.categoryCard}>
              <p className={styles.categoryLabel}>{cat.label}</p>
              <p className={styles.categoryCount}>
                {cat.count} {t.dreamsCount}
              </p>
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="dreams" />
    </div>
  );
}
