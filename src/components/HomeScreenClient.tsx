"use client";

import Link from "next/link";
import styles from "@/app/home.module.css";
import BottomNav from "@/components/BottomNav";
import FavoriteButton from "@/components/FavoriteButton";
import { LayoutGalleryIcon, TableChartIcon, ArrowUpIcon } from "@/components/Icons";
import { useLanguage } from "@/components/LanguageProvider";
import { translateMood, formatDreamDate, langFromText, type Lang } from "@/i18n/translations";
import { loadFavorites, saveFavorites } from "@/lib/favorites";
import { useState, useEffect } from "react";

type Card = {
  id: string;
  image: string;
  mood: string;
  name?: string;
  createdAt: string;
  summary?: string;
  symbols?: string[];
  keywords?: string[];
};

function matchesSearch(card: Card, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return !!(
    card.name?.toLowerCase().includes(q) ||
    card.summary?.toLowerCase().includes(q) ||
    card.mood.toLowerCase().includes(q) ||
    card.symbols?.some((s) => s.toLowerCase().includes(q)) ||
    card.keywords?.some((k) => k.toLowerCase().includes(q))
  );
}

type Category = {
  label: string;
  count: number;
};

type ViewMode = "list" | "grid";
type FilterMode = "all" | "type" | "date" | "favorite";

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

// ── CALENDAR VIEW ──────────────────────────────────────────────────────────
const DAY_LABELS_EN = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_LABELS_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

function CalendarView({ gridCards }: { gridCards: Card[] }) {
  const { lang } = useLanguage();
  const DAY_LABELS = lang === "he" ? DAY_LABELS_HE : DAY_LABELS_EN;

  const dreamsByDate = gridCards.reduce<Record<string, Card>>((acc, card) => {
    const key = card.createdAt.slice(0, 10);
    if (!acc[key]) acc[key] = card;
    return acc;
  }, {});

  const now = new Date();

  // Always show at least 6 months back for demo; extend further if older dreams exist
  let startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  if (gridCards.length > 0) {
    const earliest = gridCards.reduce(
      (min, c) => (c.createdAt < min ? c.createdAt : min),
      gridCards[0].createdAt
    );
    const earliestStart = new Date(earliest.slice(0, 7) + "-01");
    if (earliestStart < startDate) startDate = earliestStart;
  }

  // Build months newest→oldest so current month is at the top
  const months: Date[] = [];
  const cur = new Date(startDate);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  while (cur <= end) {
    months.push(new Date(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  months.reverse();

  return (
    <div className={styles.calScroll}>
      {months.map((month, mi) => {
        const year = month.getFullYear();
        const m = month.getMonth();
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        const startDow = new Date(year, m, 1).getDay();

        const weeks: (number | null)[][] = [];
        let week: (number | null)[] = Array(startDow).fill(null);
        for (let d = 1; d <= daysInMonth; d++) {
          week.push(d);
          if (week.length === 7 || d === daysInMonth) {
            weeks.push(week);
            week = [];
          }
        }

        const monthName = month.toLocaleString(lang === "he" ? "he-IL" : "en-US", { month: "long", year: "numeric" });

        return (
          <div key={`${year}-${m}`}>
            {mi > 0 && <div className={styles.calDivider} />}
            <div className={styles.calMonth}>
              <p className={styles.calMonthName}>{monthName}</p>
              <div className={styles.calDayHeaders}>
                {DAY_LABELS.map((l, i) => (
                  <span key={i} className={styles.calDayHeader}>{l}</span>
                ))}
              </div>
              {weeks.map((wk, wi) => {
                const isFirst = wi === 0 && startDow > 0;
                return (
                  <div key={wi} className={`${styles.calWeek} ${isFirst ? styles.calWeekFirst : ""}`}>
                    {wk.filter((d): d is number => d !== null).map((day) => {
                      const dateKey = `${year}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const dream = dreamsByDate[dateKey];
                      const isToday = dateKey === now.toISOString().slice(0, 10);

                      if (dream) {
                        return (
                          <Link key={day} href={`/dream/${dream.id}`} className={`${styles.calCell} ${isToday ? styles.calCellSelected : ""}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={dream.image} alt="" className={styles.calCellImg} />
                            <span className={`${styles.calCellNum} ${styles.calCellNumLight}`}>{day}</span>
                          </Link>
                        );
                      }
                      return (
                        <div
                          key={day}
                          className={`${styles.calCell} ${isToday ? styles.calCellSelected : styles.calCellEmpty}`}
                        >
                          <span className={`${styles.calCellNum} ${isToday ? styles.calCellNumLight : styles.calCellNumDark}`}>
                            {day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
// ──────────────────────────────────────────────────────────────────────────

// ── TYPE GRID ──────────────────────────────────────────────────────────────
// 2-column grid of glass pill cards, each showing a small fanned stack of
// up to 3 dream thumbnails for that mood, with "{mood} ({count} dreams)"
// centered below — matches the Figma "Gallery screen-type" grid layout.
function TypeGrid({
  categories,
  cardsByMood,
  lang,
  dreamsLabel,
}: {
  categories: { label: string; count: number }[];
  cardsByMood: Record<string, Card[]>;
  lang: Lang;
  dreamsLabel: string;
}) {
  return (
    <div className={styles.typeGrid}>
      {categories.map((cat) => {
        const cards = cardsByMood[cat.label] ?? [];
        return (
          <Link key={cat.label} href={`/type/${encodeURIComponent(cat.label)}`} className={styles.typeGridCard}>
            <div className={styles.typeGridStack}>
              {cards[2] && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={cards[2].image} alt="" className={`${styles.typeStackImg} ${styles.typeStackImg3}`} />
              )}
              {cards[1] && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={cards[1].image} alt="" className={`${styles.typeStackImg} ${styles.typeStackImg2}`} />
              )}
              {cards[0] && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={cards[0].image} alt="" className={`${styles.typeStackImg} ${styles.typeStackImg1}`} />
              )}
            </div>
            <p className={styles.typeGridLabel} dir="auto">
              {translateMood(cat.label, lang)}{" "}
              <span className={styles.typeGridCount}>({cat.count} {dreamsLabel})</span>
            </p>
          </Link>
        );
      })}
    </div>
  );
}
// ──────────────────────────────────────────────────────────────────────────

export default function HomeScreenClient({
  cards: _cards,
  gridCards,
  categories,
}: {
  cards: Card[];
  gridCards: Card[];
  categories: Category[];
}) {
  const { lang, t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [gridColumns, setGridColumns] = useState<2 | 3>(3);

  // Loaded on mount (not lazy useState init) since localStorage isn't
  // available during server render — matches DreamResultScreen's pattern
  // so both screens read/write the same "dream-favorites" key and stay
  // in sync with each other.
  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const isSearching = searchQuery.trim().length > 0;
  const searchResults = isSearching ? gridCards.filter((c) => matchesSearch(c, searchQuery)) : [];

  const filters: { key: FilterMode; label: string }[] = [
    { key: "all",      label: t.filterAll },
    { key: "date",     label: t.filterDate },
    { key: "type",     label: t.filterType },
    { key: "favorite", label: t.filterFavorite },
  ];

  // Group cards by mood for the carousel
  const cardsByMood = gridCards.reduce<Record<string, Card[]>>((acc, card) => {
    if (!acc[card.mood]) acc[card.mood] = [];
    if (acc[card.mood].length < 3) acc[card.mood].push(card);
    return acc;
  }, {});

  const recentDream = gridCards[0] ?? null;
  const collectionCards = gridCards.slice(1);
  const favoriteCards = gridCards.filter((c) => favorites.has(c.id));

  function toggleFavorite(id: string, e: React.MouseEvent) {
    e.preventDefault();
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveFavorites(next);
      return next;
    });
  }

  function renderDreamRow(card: Card) {
    return (
      <Link key={card.id} href={`/dream/${card.id}`} className={styles.dreamRow}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.image} alt="" className={styles.dreamRowThumb} />
        <div className={styles.dreamRowBody}>
          <div className={styles.dreamRowTop}>
            <p className={styles.dreamRowTitle} dir="auto">{card.name || translateMood(card.mood, lang)}</p>
            <FavoriteButton
              filled={favorites.has(card.id)}
              onToggle={(e) => toggleFavorite(card.id, e)}
              size={18}
              className={styles.dreamRowHeart}
            />
          </div>
          <p className={styles.dreamRowDate}>{formatDreamDate(card.createdAt, langFromText(card.summary, lang))}</p>
        </div>
      </Link>
    );
  }

  function renderCard(card: Card, className: string, imgClass: string, bodyClass: string, headingClass: string, subClass: string, index = 0) {
    return (
      <Link key={card.id} href={`/dream/${card.id}`} className={className} style={{ "--card-index": index } as React.CSSProperties}>
        <div className={styles.gridImgWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.image} alt="" className={imgClass} />
          <span className={styles.gridMoodTag} dir="auto">{translateMood(card.mood, lang)}</span>
          <FavoriteButton
            filled={favorites.has(card.id)}
            onToggle={(e) => toggleFavorite(card.id, e)}
            className={styles.gridHeartBtn}
          />
        </div>
        <div className={bodyClass}>
          <p className={headingClass}>{card.name || translateMood(card.mood, lang)}</p>
          <p className={subClass}>{formatDreamDate(card.createdAt, langFromText(card.summary, lang))}</p>
        </div>
      </Link>
    );
  }

  return (
    <div className={styles.screen}>
      {/* Nebula blobs */}
      <div className={`${styles.nebula} ${styles.nebulaBlue}`} />
      <div className={`${styles.nebula} ${styles.nebulaPurple}`} />
      <div className={`${styles.nebula} ${styles.nebulaCyan}`} />

      {/* Stars */}
      <span className={styles.star} style={{ width:2,   height:2,   left:28,  top:92,  opacity:0.35 }} />
      <span className={styles.star} style={{ width:1.5, height:1.5, left:118, top:156, opacity:0.25 }} />
      <span className={styles.star} style={{ width:2,   height:2,   left:302, top:110, opacity:0.30 }} />
      <span className={styles.star} style={{ width:1,   height:1,   left:342, top:210, opacity:0.20 }} />
      <span className={styles.star} style={{ width:2,   height:2,   left:52,  top:310, opacity:0.28 }} />
      <span className={styles.star} style={{ width:1.5, height:1.5, left:268, top:340, opacity:0.22 }} />
      <span className={styles.star} style={{ width:1,   height:1,   left:88,  top:520, opacity:0.18 }} />
      <span className={styles.star} style={{ width:2,   height:2,   left:320, top:620, opacity:0.26 }} />
      <span className={styles.star} style={{ width:1.5, height:1.5, left:18,  top:680, opacity:0.24 }} />

      <div className={styles.contentWrapper}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.galleryTitle}>{t.gallery}</h1>
          <div className={styles.headerBtns}>
            <button
              type="button"
              className={`${styles.headerBtn} ${viewMode === "list" ? styles.headerBtnActive : ""}`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <TableChartIcon size={18} color="currentColor" />
            </button>
            <button
              type="button"
              className={`${styles.headerBtn} ${viewMode === "grid" ? styles.headerBtnActive : ""}`}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <LayoutGalleryIcon size={18} color="currentColor" />
            </button>
          </div>
        </div>

        {/* Filter pills + expanding search — combined row */}
        <div className={styles.filterRow}>
          <div
            className={`${styles.searchToggle} ${isSearchOpen ? styles.searchToggleOpen : ""}`}
            onClick={() => { if (!isSearchOpen) setIsSearchOpen(true); }}
          >
            {isSearchOpen ? (
              <span className={styles.searchIconBtn} aria-hidden="true">
                <SearchIcon />
              </span>
            ) : (
              <button
                type="button"
                className={styles.searchIconBtn}
                onClick={() => setIsSearchOpen(true)}
                aria-label={t.searchPlaceholder}
              >
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
                className={styles.searchCloseBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                aria-label={t.searchClose}
              >
                <CloseIcon />
              </button>
            )}
          </div>

          {filters
            .filter((f) => f.key === "all" || !isSearchOpen)
            .map((f) => (
              <button
                key={f.key}
                type="button"
                className={`${styles.filterPill} ${filter === f.key ? styles.filterPillActive : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                {/* Chevron hidden for now — re-enable by restoring the condition below. */}
                {false && f.key !== "all" && f.key !== "favorite" && <ChevronIcon />}
              </button>
            ))}
        </div>

        {/* ── LIST VIEW ── */}
        {!isSearching && viewMode === "list" && filter === "all" && (
          <div className={styles.listView}>
            {recentDream && (
              <div className={styles.dreamRowGroup}>
                <p className={`${styles.sectionLabel} ${styles.sectionLabelTight}`}>{t.recentDream}</p>
                {renderDreamRow(recentDream)}
              </div>
            )}

            {collectionCards.length > 0 && (
              <div className={styles.dreamRowGroup}>
                <p className={`${styles.sectionLabel} ${styles.sectionLabelTight}`}>{t.moreCollection}</p>
                <div className={styles.dreamRowList}>
                  {collectionCards.map((card) => renderDreamRow(card))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LIST + FAVORITE: flat list, same row style as "All" ── */}
        {!isSearching && viewMode === "list" && filter === "favorite" && (
          <div className={styles.listView}>
            {favoriteCards.length === 0 ? (
              <p className={styles.comingSoon}>{t.noFavorites}</p>
            ) : (
              <div className={styles.dreamRowGroup}>
                <div className={styles.dreamRowList}>
                  {favoriteCards.map((card) => renderDreamRow(card))}
                </div>
              </div>
            )}
          </div>
        )}

        {!isSearching && viewMode === "list" && filter === "type" && (
          <div className={styles.listView}>
            <p className={`${styles.sectionLabel} ${styles.sectionLabelTight}`}>{t.recentDream}</p>
            {categories.map((cat) => (
              <Link
                key={cat.label}
                href={`/type/${encodeURIComponent(cat.label)}`}
                className={styles.listRow}
              >
                <p className={styles.listRowCategory}>{translateMood(cat.label, lang)}</p>
                <p className={styles.listRowCount}>{cat.count} {t.dreamsCount}</p>
                <p className={styles.listRowSub}>Heading</p>
                <span className={styles.listRowArrow}>
                  <ArrowUpIcon size={18} color="rgba(255,255,255,0.6)" />
                </span>
              </Link>
            ))}
          </div>
        )}

      </div>

      {/* ── DATE: Calendar view (same in both list and grid view modes) ── */}
      {!isSearching && filter === "date" && (
        <CalendarView gridCards={gridCards} />
      )}

      <div className={styles.contentWrapper}>
        {/* ── SEARCH RESULTS ── */}
        {isSearching && (
          <div className={styles.collectionGrid} style={{ paddingTop: 36, gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
            {searchResults.length === 0 ? (
              <p className={styles.comingSoon} style={{ gridColumn: "1/-1" }}>{t.searchNoResults}</p>
            ) : (
              searchResults.map((card, i) =>
                renderCard(card, styles.gridCard, styles.gridImg, styles.gridBody, styles.gridCardHeading, styles.gridCardSubheading, i)
              )
            )}
          </div>
        )}

        {/* ── GRID + FAVORITE ── */}
        {!isSearching && viewMode === "grid" && filter === "favorite" && (
          <div className={styles.collectionGrid} style={{ paddingTop: 8, gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
            {favoriteCards.length === 0 ? (
              <p className={styles.comingSoon} style={{ gridColumn: "1/-1" }}>{t.noFavorites}</p>
            ) : (
              favoriteCards.map((card, i) =>
                renderCard(card, styles.gridCard, styles.gridImg, styles.gridBody, styles.gridCardHeading, styles.gridCardSubheading, i)
              )
            )}
          </div>
        )}

        {/* ── GRID + TYPE: 2-column stacked-photo cards ── */}
        {!isSearching && viewMode === "grid" && filter === "type" && (
          <TypeGrid
            categories={categories}
            cardsByMood={cardsByMood}
            lang={lang}
            dreamsLabel={t.dreamsCount}
          />
        )}

        {/* ── GRID + ALL (default) ── */}
        {!isSearching && viewMode === "grid" && filter === "all" && (
          <>
            {recentDream && (
              <>
                <p className={`${styles.sectionLabel} ${styles.sectionLabelTight}`}>{t.recentDream}</p>
                <Link href={`/dream/${recentDream.id}`} className={styles.heroCard}>
                  <div className={styles.heroImgWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={recentDream.image} alt="" className={styles.heroImg} />
                    <span className={styles.gridMoodTag} dir="auto">{translateMood(recentDream.mood, lang)}</span>
                    <FavoriteButton
                      filled={favorites.has(recentDream.id)}
                      onToggle={(e) => toggleFavorite(recentDream.id, e)}
                      className={styles.heartBtn}
                    />
                  </div>
                  <div className={styles.heroBody}>
                    <p className={styles.cardHeading}>{recentDream.name || translateMood(recentDream.mood, lang)}</p>
                    <p className={styles.cardSubheading}>{formatDreamDate(recentDream.createdAt, langFromText(recentDream.summary, lang))}</p>
                  </div>
                </Link>
              </>
            )}

            {collectionCards.length > 0 && (
              <>
                <div className={styles.sectionHeaderRow}>
                  <p className={`${styles.sectionLabel} ${styles.sectionLabelInRow}`}>{t.moreCollection}</p>
                  <div className={styles.columnToggle}>
                    <span>{t.galleryColumnsLabel}</span>
                    <button
                      type="button"
                      className={gridColumns === 2 ? styles.columnToggleActive : ""}
                      onClick={() => setGridColumns(2)}
                    >
                      2
                    </button>
                    <button
                      type="button"
                      className={gridColumns === 3 ? styles.columnToggleActive : ""}
                      onClick={() => setGridColumns(3)}
                    >
                      3
                    </button>
                  </div>
                </div>
                <div className={styles.collectionGrid} style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
                  {collectionCards.map((card, i) =>
                    renderCard(card, styles.gridCard, styles.gridImg, styles.gridBody, styles.gridCardHeading, styles.gridCardSubheading, i)
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <BottomNav active="dreams" />
    </div>
  );
}
