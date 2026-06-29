"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "@/app/home.module.css";
import BottomNav from "@/components/BottomNav";
import DreamCardStack from "@/components/DreamCardStack";
import DreamGridView from "@/components/DreamGridView";
import DreamTypeGalleryGrid from "@/components/DreamTypeGalleryGrid";
import GalleryFilterChips, { type GalleryFilter } from "@/components/GalleryFilterChips";
import GlassEffect from "@/components/GlassEffect";
import OnboardingGate from "@/components/OnboardingGate";
import { FilterIcon, LayoutGalleryIcon, TableChartIcon } from "@/components/Icons";
import { useLanguage } from "@/components/LanguageProvider";
import { translateMood } from "@/i18n/translations";

type Card = {
  id: string;
  image: string;
  mood: string;
  createdAt: string;
  summary?: string;
};

type ViewMode = "stack" | "grid";

type Category = {
  label: string;
  count: number;
};

const CATEGORY_CARD_CLASS: Record<string, string> = {
  Sweet: styles.categoryCardSweet,
  Fear: styles.categoryCardFear,
  Confused: styles.categoryCardConfused,
  Sad: styles.categoryCardSad,
  Angry: styles.categoryCardAngry,
};

export default function HomeScreenClient({
  cards,
  gridCards,
  categories,
}: {
  cards: Card[];
  gridCards: Card[];
  categories: Category[];
}) {
  const { t, lang } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>("stack");
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>("byType");

  return (
    <div className={styles.screen}>
      <OnboardingGate />
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            className={`${styles.pillBtn} ${viewMode === "stack" ? styles.pillBtnActive : ""}`}
            aria-label="Stack view"
            aria-pressed={viewMode === "stack"}
            onClick={() => setViewMode("stack")}
          >
            {viewMode === "stack" ? <span className={styles.selectedFill} /> : <GlassEffect fill size={48} />}
            <span className={styles.iconLayer}>
              <TableChartIcon size={16} color="currentColor" />
            </span>
          </button>
          <button
            type="button"
            className={`${styles.pillBtn} ${viewMode === "grid" ? styles.pillBtnActive : ""}`}
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
          >
            {viewMode === "grid" ? <span className={styles.selectedFill} /> : <GlassEffect fill size={48} />}
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

      {viewMode === "stack" ? (
        <>
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
                  className={`${styles.categoryCard} ${CATEGORY_CARD_CLASS[cat.label] ?? ""}`}
                >
                  <p className={styles.categoryLabel}>{translateMood(cat.label, lang)}</p>
                  <p className={styles.categoryCount}>
                    {cat.count} {t.dreamsCount}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className={styles.gallerySection}>
          <GalleryFilterChips active={galleryFilter} onChange={setGalleryFilter} />
          <div className={styles.galleryContent}>
            {galleryFilter === "byType" && <DreamTypeGalleryGrid categories={categories} />}
            {galleryFilter === "all" && <DreamGridView cards={gridCards} />}
            {(galleryFilter === "latest" || galleryFilter === "analysis") && (
              <p className={styles.comingSoon}>{t.comingSoon}</p>
            )}
          </div>
        </div>
      )}

      <BottomNav active="dreams" />
    </div>
  );
}
