"use client";

import Link from "next/link";
import styles from "@/app/home.module.css";
import BottomNav from "@/components/BottomNav";
import OnboardingGate from "@/components/OnboardingGate";
import { LayoutGalleryIcon, TableChartIcon, ArrowUpIcon } from "@/components/Icons";
import { useLanguage } from "@/components/LanguageProvider";
import { translateMood, formatDreamDate, langFromText, type Lang } from "@/i18n/translations";
import { useState, useRef } from "react";

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
type FilterMode = "all" | "type" | "date" | "emotion" | "favorite";

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
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

// ── TYPE CAROUSEL ──────────────────────────────────────────────────────────
// Labels and card stacks use DIFFERENT steps (from Figma measurements):
//   Labels:  207px between each (so neighboring labels peek at screen edges)
//   Cards:   279px between each (so only edges of neighboring stacks peek in)
//
// Figma anchor points (from screen left):
//   Fear label center:      185px  → LABEL_ANCHOR
//   Fear front card left:   114px  → CARD_ANCHOR
const LABEL_STEP  = 207;
const CARD_STEP   = 279;
const CARD_ANCHOR = 114; // px from left of carousel — left edge of active front card
const CARD_W       = 174;
const CARD_H       = 340;
const LABEL_TOP    = 36;  // px from carousel top (gap below filter row)
const CARD_TOP     = 84;  // px from carousel top (36 + 24 label + 24 gap)

function TypeCarousel({
  categories,
  cardsByMood,
  lang,
}: {
  categories: { label: string; count: number }[];
  cardsByMood: Record<string, Card[]>;
  lang: Lang;
}) {
  const [active, setActive] = useState(0);
  const startX = useRef<number | null>(null);
  const wasSwiped = useRef(false);
  const easing = "0.38s cubic-bezier(0.33, 1, 0.68, 1)";

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    wasSwiped.current = false;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    const dx = Math.abs(e.clientX - startX.current);
    if (dx > 10) wasSwiped.current = true;
  }

  function onPointerUp(e: React.PointerEvent) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (dx < -40) setActive((a) => Math.min(a + 1, categories.length - 1));
    else if (dx > 40) setActive((a) => Math.max(a - 1, 0));
    startX.current = null;
  }

  return (
    <div
      className={styles.typeCarousel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* ── LABEL TRACK (step = 207px) ── */}
      {categories.map((cat, i) => (
        <p
          key={`lbl-${cat.label}`}
          className={styles.typeLabel}
          style={{
            position: "absolute",
            left: "50%",
            top: LABEL_TOP,
            transform: `translateX(calc(-50% + ${(i - active) * LABEL_STEP}px))`,
            transition: `transform ${easing}`,
          }}
        >
          {translateMood(cat.label, lang)}
        </p>
      ))}

      {/* ── CARD STACK TRACK (step = 279px) ── */}
      {categories.map((cat, i) => {
        const cards = cardsByMood[cat.label] ?? [];
        const isActive = i === active;
        return (
          <div
            key={`stack-${cat.label}`}
            style={{
              position: "absolute",
              left: CARD_ANCHOR,
              top: CARD_TOP,
              width: CARD_W,
              height: CARD_H,
              transform: `translateX(${(i - active) * CARD_STEP}px)`,
              transition: `transform ${easing}`,
              pointerEvents: isActive ? "auto" : "none",
            }}
          >
            {/* Back-right (lowest z) */}
            {cards[2] && (
              <div className={styles.typeBackRight}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cards[2].image} alt="" className={styles.typeCardImg} />
              </div>
            )}
            {/* Back-left */}
            {cards[1] && (
              <div className={styles.typeBackLeft}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cards[1].image} alt="" className={styles.typeCardImg} />
              </div>
            )}
            {/* Front card */}
            <Link
              href={`/type/${encodeURIComponent(cat.label)}`}
              className={styles.typeFront}
              onClick={(e) => { if (wasSwiped.current) { wasSwiped.current = false; e.preventDefault(); } }}
            >
              {cards[0] ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cards[0].image} alt="" className={styles.typeCardImg} />
                </>
              ) : (
                <div style={{ flex: 1, borderRadius: 10, background: "rgba(0,0,0,0.1)" }} />
              )}
              <div className={styles.typeCardBody}>
                <p className={styles.typeCardHeading}>{translateMood(cat.label, lang)}</p>
                <p className={styles.typeCardSub}>{cards[0] ? formatDreamDate(cards[0].createdAt, langFromText(cards[0].summary, lang)) : ""}</p>
              </div>
            </Link>
          </div>
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

  const isSearching = searchQuery.trim().length > 0;
  const searchResults = isSearching ? gridCards.filter((c) => matchesSearch(c, searchQuery)) : [];

  const filters: { key: FilterMode; label: string }[] = [
    { key: "all",      label: t.filterAll },
    { key: "date",     label: t.filterDate },
    { key: "type",     label: t.filterType },
    { key: "emotion",  label: t.filterEmotion },
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
      return next;
    });
  }

  function renderCard(card: Card, className: string, imgClass: string, bodyClass: string, headingClass: string, subClass: string) {
    return (
      <Link key={card.id} href={`/dream/${card.id}`} className={className}>
        <div className={styles.gridImgWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.image} alt="" className={imgClass} />
          <button type="button" className={styles.gridHeartBtn} aria-label="Favourite" onClick={(e) => toggleFavorite(card.id, e)}>
            <HeartIcon filled={favorites.has(card.id)} />
          </button>
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

      <OnboardingGate />

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

        {/* Search */}
        <div className={styles.searchBar}>
          <SearchIcon />
          <input
            className={styles.searchInput}
            type="search"
            dir="auto"
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter pills — hidden while searching */}
        {!isSearching && (
          <div className={styles.filterRow}>
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`${styles.filterPill} ${filter === f.key ? styles.filterPillActive : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                {f.key !== "all" && f.key !== "favorite" && <ChevronIcon />}
              </button>
            ))}
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {!isSearching && viewMode === "list" && (
          <div className={styles.listView}>
            <p className={styles.sectionLabel}>{t.recentDream}</p>
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

      {/* ── GRID + TYPE: Stacked carousel (outside wrapper, bleeds to edges) ── */}
      {!isSearching && viewMode === "grid" && filter === "type" && (
        <TypeCarousel
          categories={categories}
          cardsByMood={cardsByMood}
          lang={lang}
        />
      )}

      {/* ── GRID + DATE: Calendar view ── */}
      {!isSearching && viewMode === "grid" && filter === "date" && (
        <CalendarView gridCards={gridCards} />
      )}

      <div className={styles.contentWrapper}>
        {/* ── SEARCH RESULTS ── */}
        {isSearching && (
          <div className={styles.collectionGrid} style={{ paddingTop: 36 }}>
            {searchResults.length === 0 ? (
              <p className={styles.comingSoon} style={{ gridColumn: "1/-1" }}>{t.searchNoResults}</p>
            ) : (
              searchResults.map((card) =>
                renderCard(card, styles.gridCard, styles.gridImg, styles.gridBody, styles.gridCardHeading, styles.gridCardSubheading)
              )
            )}
          </div>
        )}

        {/* ── GRID + FAVORITE ── */}
        {!isSearching && viewMode === "grid" && filter === "favorite" && (
          <div className={styles.collectionGrid} style={{ paddingTop: 8 }}>
            {favoriteCards.length === 0 ? (
              <p className={styles.comingSoon} style={{ gridColumn: "1/-1" }}>{t.noFavorites}</p>
            ) : (
              favoriteCards.map((card) =>
                renderCard(card, styles.gridCard, styles.gridImg, styles.gridBody, styles.gridCardHeading, styles.gridCardSubheading)
              )
            )}
          </div>
        )}

        {/* ── GRID + ALL (default) ── */}
        {!isSearching && viewMode === "grid" && (filter === "all" || filter === "emotion") && (
          <>
            {recentDream && (
              <>
                <p className={styles.sectionLabel}>{t.recentDream}</p>
                <Link href={`/dream/${recentDream.id}`} className={styles.heroCard}>
                  <div className={styles.heroImgWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={recentDream.image} alt="" className={styles.heroImg} />
                    <button type="button" className={styles.heartBtn} aria-label="Favourite" onClick={(e) => toggleFavorite(recentDream.id, e)}>
                      <HeartIcon filled={favorites.has(recentDream.id)} />
                    </button>
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
                <p className={styles.sectionLabel}>{t.moreCollection}</p>
                <div className={styles.collectionGrid}>
                  {collectionCards.map((card) =>
                    renderCard(card, styles.gridCard, styles.gridImg, styles.gridBody, styles.gridCardHeading, styles.gridCardSubheading)
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
