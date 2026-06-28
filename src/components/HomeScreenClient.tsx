"use client";

import Link from "next/link";
import styles from "@/app/home.module.css";
import BottomNav from "@/components/BottomNav";
import DreamCardStack from "@/components/DreamCardStack";
import GlassEffect from "@/components/GlassEffect";
import OnboardingGate from "@/components/OnboardingGate";
import { FilterIcon, LayoutGalleryIcon, TableChartIcon } from "@/components/Icons";
import { useLanguage } from "@/components/LanguageProvider";
import { translateMood } from "@/i18n/translations";

type Card = {
  id: string;
  image: string;
  mood: string;
  date: string;
  time: string;
  summary?: string;
};

type Category = {
  label: string;
  count: number;
};

export default function HomeScreenClient({ cards, categories }: { cards: Card[]; categories: Category[] }) {
  const { t, lang } = useLanguage();

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
          {categories.map((cat) => (
            <Link
              key={cat.label}
              href={`/type/${encodeURIComponent(cat.label)}`}
              className={styles.categoryCard}
            >
              <p className={styles.categoryLabel}>{translateMood(cat.label, lang)}</p>
              <p className={styles.categoryCount}>
                {cat.count} {t.dreamsCount}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <BottomNav active="dreams" />
    </div>
  );
}
