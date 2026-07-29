"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import styles from "./ExhibitionGallery.module.css";
import FavoriteButton from "@/components/FavoriteButton";
import { LayoutGalleryIcon, TableChartIcon } from "@/components/Icons";
import { translateMood, formatDreamDate, langFromText, type Lang } from "@/i18n/translations";
import { toGalleryThumbnailUrl } from "@/lib/thumbnail";
import { useLanguage } from "@/components/LanguageProvider";
import { CalendarView } from "@/components/CalendarView";
import { CategoryOverlay } from "@/components/CategoryOverlay";

// Same fixed mood list gallery/page.tsx itself uses for the Type filter's
// category counts — kept local (not a shared constants file) to match
// that existing convention rather than introducing a new one.
const MOOD_TYPES = ["Fear", "Confused", "Sweet", "Sad", "Angry"] as const;

type Card = {
  id: string;
  image: string;
  mood: string;
  name?: string;
  createdAt: string;
  summary?: string;
};

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// Purpose-built composition for the 1080x1920 Exhibition canvas, matching
// the Figma export's exact measurements directly — not adapted from the
// responsive Gallery's own JSX/CSS (see ExhibitionGallery.module.css's
// header comment). Reuses the same data/favorites/translation plumbing
// as the responsive Gallery (HomeScreenClient), but its own markup, so
// there's no cascade fighting between the two.
export default function ExhibitionGallery({
  gridCards,
  favorites,
  onToggleFavorite,
}: {
  gridCards: Card[];
  favorites: Set<string>;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}) {
  const { lang, t } = useLanguage();
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [filter, setFilter] = useState<"all" | "type" | "date" | "favorite">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Which mood tile is expanded into <CategoryOverlay> — mirrors
  // HomeScreenClient's own openMood pattern for the responsive Gallery's
  // TypeGrid, but simpler: no shared-element layoutId handoff, since
  // there's no "frozen folder" to animate out of here.
  const [openMood, setOpenMood] = useState<string | null>(null);

  const isSearching = searchQuery.trim().length > 0;
  const q = searchQuery.trim().toLowerCase();
  const searchResults = isSearching
    ? gridCards.filter((c) => (c.name || "").toLowerCase().includes(q) || translateMood(c.mood, lang).toLowerCase().includes(q))
    : [];

  const filters: { key: typeof filter; label: string }[] = [
    { key: "all", label: t.filterAll },
    { key: "date", label: t.filterDate },
    { key: "type", label: t.filterType },
    { key: "favorite", label: t.filterFavorite },
  ];

  const favoriteCards = gridCards.filter((c) => favorites.has(c.id));
  const categories = MOOD_TYPES.map((mood) => ({
    label: mood,
    count: gridCards.filter((c) => c.mood === mood).length,
  }));

  // Figma's featured row shows 2 cards side by side — filled with the 2
  // most recent real dreams (not a fabricated placeholder second card).
  // A brand-new account with 0-1 dreams just gets a shorter/empty row
  // instead.
  const featuredCards = filter === "all" && !isSearching ? gridCards.slice(0, 2) : [];
  const restCards =
    filter === "all" && !isSearching
      ? gridCards.slice(2)
      : filter === "favorite"
      ? favoriteCards
      : isSearching
      ? searchResults
      : gridCards; // "date"/"type" fall back to the same flat grid — Figma
        // doesn't define a distinct exhibition composition for either.

  function renderCard(card: Card, key: string, extraClassName?: string) {
    return (
      <Link
        key={key}
        href={`/dream/${card.id}`}
        className={`${styles.card} ${extraClassName ?? ""}`}
      >
        <div className={styles.cardImgWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={toGalleryThumbnailUrl(card.image)} alt="" className={styles.cardImg} loading="lazy" decoding="async" />
          <span className={styles.cardTag} dir="auto">{translateMood(card.mood, lang)}</span>
          <FavoriteButton
            filled={favorites.has(card.id)}
            onToggle={(e) => onToggleFavorite(card.id, e)}
            className={styles.cardHeart}
          />
        </div>
        <div className={styles.cardBody}>
          <p className={styles.cardHeading}>{card.name || translateMood(card.mood, lang)}</p>
          <p className={styles.cardSubheading}>{formatDreamDate(card.createdAt, langFromText(card.summary, lang as Lang))}</p>
        </div>
      </Link>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{t.gallery}</h1>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewBtnActive : ""}`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <TableChartIcon size={35} color="currentColor" />
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtnActive : ""}`}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <LayoutGalleryIcon size={35} color="currentColor" />
            </button>
          </div>
        </div>

        <div className={styles.filterRow}>
          <div
            className={`${styles.searchPill} ${isSearchOpen ? styles.searchPillOpen : ""}`}
            onClick={() => { if (!isSearchOpen) setIsSearchOpen(true); }}
          >
            {isSearchOpen ? (
              <span className={styles.searchIconBtn} aria-hidden="true"><SearchIcon /></span>
            ) : (
              <button type="button" className={styles.searchIconBtn} onClick={() => setIsSearchOpen(true)} aria-label={t.searchPlaceholder}>
                <SearchIcon />
              </button>
            )}
            {!isSearchOpen && <span className={styles.searchLabel}>{t.searchPlaceholder}</span>}
            {isSearchOpen && (
              <input
                autoFocus
                className={styles.searchInput}
                type="search"
                dir="auto"
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            )}
            {isSearchOpen && (
              <button
                type="button"
                className={styles.searchIconBtn}
                onClick={(e) => { e.stopPropagation(); setSearchQuery(""); setIsSearchOpen(false); }}
                aria-label={t.searchClose}
              >
                <CloseIcon />
              </button>
            )}
          </div>

          {filters.filter((f) => f.key === "all" || !isSearchOpen).map((f) => (
            <button
              key={f.key}
              type="button"
              className={`${styles.filterPill} ${filter === f.key ? styles.filterPillActive : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        {filter === "type" && !isSearching ? (
          <div>
            <div className={styles.sectionHeaderRow}>
              <p className={styles.sectionLabel}>{t.filterType}</p>
            </div>
            <div className={styles.moodTileGrid}>
              {categories.map((cat) => {
                const preview = gridCards.find((c) => c.mood === cat.label);
                return (
                  <button
                    key={cat.label}
                    type="button"
                    className={styles.moodTile}
                    onClick={() => setOpenMood(cat.label)}
                  >
                    {preview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={toGalleryThumbnailUrl(preview.image)} alt="" className={styles.moodTileImg} />
                    )}
                    <span className={styles.moodTileLabel}>{translateMood(cat.label, lang)}</span>
                    <span className={styles.moodTileCount}>{cat.count} {t.dreamsCount}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : filter === "date" && !isSearching ? (
          <CalendarView gridCards={gridCards} />
        ) : (
          <>
            {featuredCards.length > 0 && (
              <div>
                <p className={styles.sectionLabel}>{t.recentDream}</p>
                <div className={styles.featuredRow}>
                  {featuredCards.map((card) =>
                    renderCard(card, card.id, styles.featuredCard)
                  )}
                </div>
              </div>
            )}

            <div>
              <div className={styles.sectionHeaderRow}>
                <p className={styles.sectionLabel}>
                  {filter === "all" && !isSearching ? t.moreCollection : filters.find((f) => f.key === filter)?.label}
                </p>
              </div>
              {restCards.length === 0 ? (
                <p className={styles.comingSoon}>{isSearching ? t.searchNoResults : t.noFavorites}</p>
              ) : (
                <div className={styles.grid}>
                  {restCards.map((card) => renderCard(card, card.id, styles.gridCard))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {openMood && (
          <CategoryOverlay
            mood={openMood}
            dreams={gridCards.filter((c) => c.mood === openMood)}
            stackCards={[]}
            lang={lang}
            t={t}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            onClose={() => setOpenMood(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
