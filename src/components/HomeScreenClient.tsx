"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import type { Variants } from "framer-motion";
import styles from "@/app/home.module.css";
import BottomNav from "@/components/BottomNav";
import FavoriteButton from "@/components/FavoriteButton";
import DreamResultScreen from "@/components/DreamResultScreen";
import { LayoutGalleryIcon, TableChartIcon, ArrowUpIcon, ArrowLeftIcon } from "@/components/Icons";
import { useLanguage } from "@/components/LanguageProvider";
import { translateMood, formatDreamDate, langFromText, type Lang } from "@/i18n/translations";
import { loadFavorites, saveFavorites } from "@/lib/favorites";
import { useIdleAnimationPause } from "@/lib/useIdleAnimationPause";
import { toGalleryThumbnailUrl } from "@/lib/thumbnail";
import { useState, useEffect, useRef } from "react";

// Calm, physical "dreamy" easing per the app's motion system — matches
// src/components/onboarding/motion.ts's EASE so screen-to-screen and
// element transitions feel like one consistent app, not per-screen ad hoc
// values.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Gallery → Dream Analysis transition timings. The overlay renders the
// real DreamResultScreen in place (see DreamAnalysisOverlay below), so
// there's exactly one shared layoutId FLIP and one content stagger —
// not a separate preview animation followed by a second one when the
// real route mounts. NAVIGATE_AFTER just needs to roughly match
// DreamResultScreen's own total entrance time (image FLIP + its content
// stagger, ~600ms) so the eventual route swap lands after everything
// has already settled, instead of interrupting it mid-flight.
const GALLERY_EXIT_DURATION = 0.2; // header/filters/cards/background exit
const NAVIGATE_AFTER = 650; // ms — when we swap to the real route, after the overlay has settled

// Switching between Gallery filters (All/Date/Type/Favorite) — a
// distinct, faster motion language from the app's usual EASE: ease-in-out
// rather than ease-out, and short enough (250–350ms total) to feel like
// flipping a tab, not opening a new screen. Only the content area below
// the (stable) header/filter row/background/BottomNav ever moves.
const CONTENT_EASE = "easeInOut";
const CONTENT_EXIT_DURATION = 0.13;
const CONTENT_ENTER_DURATION = 0.2;

// One reusable wrapper for every Gallery content view (grid, list,
// calendar) — exit fades+shifts 8px down+blurs, enter fades+shifts up
// from 8px below+unblurs, with mode="popLayout" so the outgoing view is
// pulled out of layout flow immediately instead of both stacking and
// pushing height around, letting the two overlap with no blank frame.
function ViewTransition({ viewKey, children }: { viewKey: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={viewKey}
        initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
        animate={{
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: CONTENT_ENTER_DURATION, ease: CONTENT_EASE },
        }}
        exit={{
          opacity: 0,
          y: 8,
          filter: "blur(2px)",
          transition: { duration: CONTENT_EXIT_DURATION, ease: CONTENT_EASE },
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

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

  // Only dream thumbnails get a (very small, capped) individual stagger —
  // empty dates never animate on their own, they just appear as part of
  // the calendar's one whole-group fade-in below.
  let dreamCellIndex = 0;

  return (
    <motion.div
      className={styles.calScroll}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: CONTENT_ENTER_DURATION, ease: CONTENT_EASE }}
    >
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
                  <div key={wi} className={styles.calWeek}>
                    {wk.filter((d): d is number => d !== null).map((day, idx) => {
                      // Only the first week can have leading empty days
                      // (the month not starting on Sunday) — instead of
                      // rendering placeholder cells, offset its first
                      // real cell directly into the correct grid column.
                      const gridColumnStart = isFirst && idx === 0 ? startDow + 1 : undefined;
                      const dateKey = `${year}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const dream = dreamsByDate[dateKey];
                      const isToday = dateKey === now.toISOString().slice(0, 10);

                      if (dream) {
                        const delay = Math.min(dreamCellIndex * 0.015, 0.3);
                        dreamCellIndex += 1;
                        return (
                          <motion.div
                            key={day}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: CONTENT_ENTER_DURATION, ease: CONTENT_EASE, delay }}
                            style={{ gridColumnStart }}
                          >
                            <Link href={`/dream/${dream.id}`} className={`${styles.calCell} ${isToday ? styles.calCellSelected : ""}`}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={dream.image} alt="" className={styles.calCellImg} loading="lazy" decoding="async" />
                              <span className={`${styles.calCellNum} ${styles.calCellNumLight}`}>{day}</span>
                            </Link>
                          </motion.div>
                        );
                      }
                      return (
                        <div
                          key={day}
                          className={`${styles.calCell} ${isToday ? styles.calCellSelected : styles.calCellEmpty}`}
                          style={{ gridColumnStart }}
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
    </motion.div>
  );
}
// ──────────────────────────────────────────────────────────────────────────

// ── TYPE GRID ──────────────────────────────────────────────────────────────
// 2-column grid of glass pill cards, each showing a small fanned stack of
// up to 3 dream thumbnails for that mood, with "{mood} ({count} dreams)"
// centered below — matches the Figma "Gallery screen-type" grid layout.
//
// Tapping a card doesn't navigate — it opens <CategoryOverlay> in place.
// The 3 stacked thumbnails carry a `layoutId` shared with their full-size
// counterparts in the overlay's grid, so Framer Motion animates them
// (position/size/border-radius/rotation, transform+opacity only) from the
// folder straight into the destination grid instead of cutting instantly.
// The glass pill's background/border/label are a separate absolutely
// positioned layer behind the images so they can fade out on open without
// dragging the (still-animating) images' opacity down with them.
const STACK_ROTATIONS = [29.21, 10.96, -9.7]; // cards[0], cards[1], cards[2]

// The .typeStackImg1/2/3 CSS positions (left: 39.873%/23.418%/6.962%,
// i.e. 63/37/11 out of the 158px reference width the stack box scales
// from) are tuned to center a full 3-card rotated fan inside the stack
// box. With fewer cards, reusing those same positions leaves the group
// lopsided (e.g. a lone card sitting at the "front" slot has ~56px of
// empty space on one side and ~12px on the other) — these per-count
// overrides recenter the visible group's actual (post-rotation)
// bounding box instead. Expressed as % (not px) so it scales down
// together with the stack on narrow screens. Indexed by
// [visibleCount][stackIndex], stackIndex 0 = front.
const STACK_LEFT_BY_COUNT: Record<number, string[]> = {
  1: ["25.949%"], // 41 / 158
  2: ["31.646%", "15.190%"], // 50 / 158, 24 / 158
  3: ["39.873%", "23.418%", "6.962%"], // 63 / 158, 37 / 158, 11 / 158
};

function TypeGrid({
  categories,
  cardsByMood,
  lang,
  dreamsLabel,
  openMood,
  onOpen,
}: {
  categories: { label: string; count: number }[];
  cardsByMood: Record<string, Card[]>;
  lang: Lang;
  dreamsLabel: string;
  openMood: string | null;
  onOpen: (mood: string) => void;
}) {
  // Category cards fade in with a short 30–40ms stagger — opacity/y only,
  // no rotation or dramatic movement (the fanned photo stack's own tilt
  // is unrelated, already handled by STACK_ROTATIONS below).
  const cardStagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.035 } },
  };
  const cardFadeUp: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: CONTENT_ENTER_DURATION, ease: CONTENT_EASE } },
  };

  return (
    <motion.div className={styles.typeGrid} variants={cardStagger} initial="hidden" animate="show">
      {categories.map((cat) => {
        const cards = cardsByMood[cat.label] ?? [];
        const isOpen = openMood === cat.label;
        return (
          <motion.div
            key={cat.label}
            className={styles.typeGridCardWrap}
            variants={cardFadeUp}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(cat.label)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(cat.label); } }}
          >
            <motion.div
              className={styles.typeGridCardBg}
              animate={{ opacity: isOpen ? 0 : 1 }}
              transition={{ duration: 0.25, ease: EASE }}
            />
            <div className={styles.typeGridStack}>
              {(() => {
                const visibleCount = Math.min(cards.length, 3);
                const lefts = STACK_LEFT_BY_COUNT[visibleCount] ?? STACK_LEFT_BY_COUNT[3];
                return [cards[2], cards[1], cards[0]].map((card, i) => {
                  // i=0 is cards[2] (back), i=2 is cards[0] (front) — stack
                  // position classes/z-index stay in that back-to-front order.
                  if (!card) return null;
                  const stackIndex = 2 - i; // 0 = front/cards[0], 2 = back/cards[2]
                  const posClass = [styles.typeStackImg1, styles.typeStackImg2, styles.typeStackImg3][stackIndex];
                  return (
                    <motion.img
                      key={card.id}
                      layoutId={`type-thumb-${card.id}`}
                      src={card.image}
                      alt=""
                      className={`${styles.typeStackImg} ${posClass}`}
                      style={{ rotate: STACK_ROTATIONS[stackIndex], left: lefts[stackIndex] }}
                      transition={{ duration: 0.5, ease: EASE }}
                    />
                  );
                });
              })()}
            </div>
            <motion.p
              className={styles.typeGridLabel}
              dir="auto"
              animate={{ opacity: isOpen ? 0 : 1 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              {translateMood(cat.label, lang)}{" "}
              <span className={styles.typeGridCount}>({cat.count} {dreamsLabel})</span>
            </motion.p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
// ──────────────────────────────────────────────────────────────────────────

// ── CATEGORY OVERLAY ─────────────────────────────────────────────────────
// Destination of the TypeGrid shared-element transition. Not a real route
// navigation — it's rendered in place over the (still-mounted, frozen)
// Gallery so the folder's images can animate straight into this grid via
// the matching `type-thumb-${id}` layoutId, then the rest of that mood's
// dreams reveal with a subtle stagger.
function CategoryOverlay({
  mood,
  dreams,
  stackCards,
  lang,
  t,
  favorites,
  onToggleFavorite,
  onClose,
}: {
  mood: string;
  dreams: Card[];
  stackCards: Card[];
  lang: Lang;
  t: ReturnType<typeof useLanguage>["t"];
  favorites: Set<string>;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onClose: () => void;
}) {
  const stackIds = new Set(stackCards.map((c) => c.id));
  const restDreams = dreams.filter((d) => !stackIds.has(d.id));

  function renderChrome(card: Card) {
    return (
      <>
        <span className={styles.gridMoodTag} dir="auto">{translateMood(card.mood, lang)}</span>
        <FavoriteButton
          filled={favorites.has(card.id)}
          onToggle={(e) => onToggleFavorite(card.id, e)}
          className={styles.gridHeartBtn}
        />
      </>
    );
  }

  return (
    <>
      <motion.div
        className={styles.overlayBackdrop}
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 0.35, backdropFilter: "blur(5px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={{ duration: 0.35, ease: EASE }}
        onClick={onClose}
      />
      <motion.div
        className={styles.overlayPanel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <motion.div
          className={styles.overlayHeader}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, ease: EASE, delay: 0.15 }}
        >
          <button type="button" className={styles.overlayBackBtn} onClick={onClose} aria-label="Back">
            <ArrowLeftIcon size={16} color="currentColor" />
          </button>
          <p className={styles.overlayTitle}>{translateMood(mood, lang)}</p>
          <span className={styles.overlayCount}>{dreams.length} {t.dreamsCount}</span>
        </motion.div>

        <div className={styles.collectionGrid} style={{ paddingTop: 8 }}>
          {/* Shared cards — same images that were fanned in the folder,
              now landing in their full grid slots via layoutId. */}
          {stackCards.map((card) => (
            <div key={card.id} className={styles.gridCard} style={{ position: "relative" }}>
              <div className={styles.sharedThumbSlot}>
                <motion.img
                  layoutId={`type-thumb-${card.id}`}
                  src={card.image}
                  alt=""
                  className={styles.sharedThumbImg}
                  style={{ rotate: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, ease: EASE, delay: 0.3 }}
                >
                  {renderChrome(card)}
                </motion.div>
              </div>
              <motion.div
                className={styles.gridBody}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, ease: EASE, delay: 0.32 }}
              >
                <p className={styles.gridCardHeading}>{card.name || translateMood(card.mood, lang)}</p>
                <p className={styles.gridCardSubheading}>{formatDreamDate(card.createdAt, langFromText(card.summary, lang))}</p>
              </motion.div>
              <Link href={`/dream/${card.id}`} className={styles.sharedCardTapArea} aria-label={card.name || translateMood(card.mood, lang)} />
            </div>
          ))}

          {/* Remaining dreams — subtle staggered reveal once the shared
              cards have landed. */}
          <motion.div
            className={styles.overlayStaggerGroup}
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { delayChildren: 0.32, staggerChildren: 0.04 } },
            }}
          >
            {restDreams.map((card) => (
              <motion.div
                key={card.id}
                className={styles.overlayStaggerItem}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <Link href={`/dream/${card.id}`} className={styles.gridCard}>
                  <div className={styles.gridImgWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={card.image} alt="" className={styles.gridImg} />
                    {renderChrome(card)}
                  </div>
                  <div className={styles.gridBody}>
                    <p className={styles.gridCardHeading}>{card.name || translateMood(card.mood, lang)}</p>
                    <p className={styles.gridCardSubheading}>{formatDreamDate(card.createdAt, langFromText(card.summary, lang))}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {dreams.length === 0 && (
            <p className={styles.comingSoon} style={{ gridColumn: "1/-1" }}>{t.searchNoResults}</p>
          )}
        </div>
      </motion.div>
    </>
  );
}
// ──────────────────────────────────────────────────────────────────────────

// ── DREAM ANALYSIS OVERLAY ───────────────────────────────────────────────
// Renders the REAL DreamResultScreen in place over the (frozen, blurred)
// Gallery — not a bespoke preview layout — so there is exactly one shared
// layoutId FLIP (thumbnail → final image position/size, handled entirely
// by DreamResultScreen's own <motion.img layoutId>) and exactly one
// content stagger (also DreamResultScreen's own). When HomeScreenClient
// later swaps to the real /dream/[id] route, that page renders the same
// component with skipEntrance=true, so it appears already-settled instead
// of replaying the animation — one continuous motion, no second jump.
//
// The grid only has the trimmed list-view fields (see LIST_COLUMNS in
// dreams-store.ts), not the full interpretation/dreamText, so this fetches
// the rest from /api/dream/[id] the moment it opens. The image position/
// size never depends on that fetch — only the text content upgrades in
// place once it resolves.
function DreamAnalysisOverlay({ card, lang, onClose }: { card: Card; lang: Lang; onClose: () => void }) {
  const [full, setFull] = useState<{
    name?: string;
    imageUrl: string;
    clearImageUrl?: string;
    printImageUrl?: string;
    interpretationText?: string;
    symbols: string[];
    dreamText?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dream/${card.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setFull({
          name: data.name,
          imageUrl: data.imageUrl,
          clearImageUrl: data.clearImageUrl,
          printImageUrl: data.printImageUrl,
          interpretationText: data.interpretationText,
          symbols: data.symbols ?? [],
          dreamText: data.dreamText,
        });
      })
      .catch(() => {
        // Non-fatal — the overlay already has enough (image/mood/date/
        // summary) from the tapped card to render the layout; the real
        // /dream/[id] route (arriving shortly regardless) has its own
        // independent server-side fetch and isn't affected by this.
      });
    return () => {
      cancelled = true;
    };
  }, [card.id]);

  return (
    <motion.div
      className={styles.openOverlayRoot}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: EASE }}
    >
      <DreamResultScreen
        id={card.id}
        name={full?.name ?? card.name}
        imageUrl={full?.imageUrl ?? card.image}
        clearImageUrl={full?.clearImageUrl}
        printImageUrl={full?.printImageUrl}
        createdAt={card.createdAt}
        mood={card.mood}
        summaryText={card.summary ?? ""}
        interpretationText={full?.interpretationText}
        symbols={full?.symbols ?? card.symbols ?? []}
        dreamText={full?.dreamText}
        onBack={onClose}
      />
    </motion.div>
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
  const router = useRouter();
  const { lang, t } = useLanguage();
  // The pulsing background gradient (.screen::before) is purely
  // decorative — pause it once the user's settled in or after a few
  // idle seconds, matching every other screen (see useIdleAnimationPause).
  const { paused: bgAnimPaused, rootRef: screenRef } = useIdleAnimationPause();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [gridColumns, setGridColumns] = useState<2 | 3>(3);
  // Which Type-grid mood is expanded into <CategoryOverlay>. Not a route
  // param — the overlay renders in place over the still-mounted Gallery
  // so the shared-element transition has both ends of the animation
  // (folder thumbnails + destination grid) mounted at once.
  const [openMood, setOpenMood] = useState<string | null>(null);

  // Tapped dream card mid-transition into /dream/[id]. Next.js App Router
  // can't keep the Gallery and the destination route mounted at once (no
  // real cross-route shared layout), so <DreamAnalysisOverlay> renders the
  // real DreamResultScreen in place first — one shared layoutId FLIP, one
  // content stagger — then this swaps to the real route once that's had
  // time to fully settle (see NAVIGATE_AFTER), where it re-mounts with
  // skipEntrance so it doesn't replay any of it.
  const [openingCard, setOpeningCard] = useState<Card | null>(null);
  // Explicit `number` (not ReturnType<typeof window.setTimeout>) — with
  // @types/node in scope, that ReturnType resolves to Node's Timeout
  // instead of the DOM's number, even though this is client-only code
  // where window.setTimeout always returns a number.
  const navigateTimeoutRef = useRef<number | null>(null);

  function openDream(card: Card) {
    if (openingCard) return;
    setOpeningCard(card);
    navigateTimeoutRef.current = window.setTimeout(() => {
      router.push(`/dream/${card.id}?transitioned=1`);
    }, NAVIGATE_AFTER);
  }

  function closeDream() {
    if (navigateTimeoutRef.current) window.clearTimeout(navigateTimeoutRef.current);
    setOpeningCard(null);
  }

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
    const isOpening = openingCard?.id === card.id;
    return (
      <Link
        key={card.id}
        href={`/dream/${card.id}`}
        prefetch={false}
        className={className}
        style={{ "--card-index": index } as React.CSSProperties}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let new-tab/middle-click behave normally
          e.preventDefault();
          openDream(card);
        }}
      >
        <motion.div className={styles.gridImgWrap} whileTap={{ scale: 0.98 }} transition={{ duration: 0.08 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            layoutId={`dream-photo-${card.id}`}
            src={toGalleryThumbnailUrl(card.image)}
            alt=""
            className={imgClass}
            style={{ opacity: isOpening ? 0 : 1 }}
            transition={{ type: "tween", duration: 0.45, ease: EASE }}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.dataset.fallback) return;
              img.dataset.fallback = "1";
              img.src = card.image;
            }}
          />
          <span className={styles.gridMoodTag} dir="auto">{translateMood(card.mood, lang)}</span>
          <FavoriteButton
            filled={favorites.has(card.id)}
            onToggle={(e) => toggleFavorite(card.id, e)}
            className={styles.gridHeartBtn}
          />
        </motion.div>
        <div className={bodyClass}>
          <p className={headingClass}>{card.name || translateMood(card.mood, lang)}</p>
          <p className={subClass}>{formatDreamDate(card.createdAt, langFromText(card.summary, lang))}</p>
        </div>
      </Link>
    );
  }

  return (
    <LayoutGroup>
    <div ref={screenRef} className={`${styles.screen} ${bgAnimPaused ? styles.animPaused : ""}`}>
      {/* Frozen while the category overlay OR a dream is opening — the
          whole Gallery (including BottomNav) stops receiving touch/click
          input, per the shared-element transition spec, while it stays
          visible/mounted underneath the dimmed + blurred backdrop. */}
      <motion.div
        style={{ pointerEvents: openMood || openingCard ? "none" : undefined }}
        aria-hidden={openMood || openingCard ? true : undefined}
        animate={{ filter: openingCard ? "blur(6px) brightness(0.75)" : "blur(0px) brightness(1)" }}
        transition={{ duration: GALLERY_EXIT_DURATION, ease: EASE }}
      >
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
        {/* Header + filters: move up 12px and fade out together as one
            unit while a dream is opening. */}
        <motion.div
          animate={{ opacity: openingCard ? 0 : 1, y: openingCard ? -12 : 0 }}
          transition={{ duration: GALLERY_EXIT_DURATION, ease: EASE }}
        >
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
              <motion.button
                key={f.key}
                type="button"
                className={`${styles.filterPill} ${filter === f.key ? styles.filterPillActive : ""}`}
                onClick={() => setFilter(f.key)}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.12, ease: CONTENT_EASE }}
              >
                {/* Shared layoutId — Framer FLIPs this single white
                    background between pills instead of it just
                    appearing/disappearing on each one independently. */}
                {filter === f.key && (
                  <motion.span
                    layoutId="activeFilterPillBg"
                    className={styles.filterPillActiveBg}
                    transition={{ type: "tween", duration: 0.22, ease: CONTENT_EASE }}
                  />
                )}
                <span className={styles.filterPillLabel}>
                  {f.label}
                  {/* Chevron hidden for now — re-enable by restoring the condition below. */}
                  {false && f.key !== "all" && f.key !== "favorite" && <ChevronIcon />}
                </span>
              </motion.button>
            ))}
        </div>
        </motion.div>

        {/* Gallery cards (list view rows here; grid view further below in
            the second .contentWrapper) simply fade out — no movement,
            per the transition spec's "Gallery cards fade out". */}
        <motion.div
          animate={{ opacity: openingCard ? 0 : 1 }}
          transition={{ duration: GALLERY_EXIT_DURATION, ease: EASE }}
        >
        {!isSearching && viewMode === "list" && filter !== "date" && (
          <ViewTransition viewKey={`list-${filter}`}>
            {/* ── LIST VIEW ── */}
            {filter === "all" && (
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
            {filter === "favorite" && (
              <div className={styles.listView}>
                {favoriteCards.length === 0 ? (
                  <motion.p
                    className={styles.comingSoon}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: CONTENT_ENTER_DURATION, ease: CONTENT_EASE }}
                  >
                    {t.noFavorites}
                  </motion.p>
                ) : (
                  <div className={styles.dreamRowGroup}>
                    <div className={styles.dreamRowList}>
                      {favoriteCards.map((card) => renderDreamRow(card))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {filter === "type" && (
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
          </ViewTransition>
        )}

        </motion.div>
      </div>

      {/* ── DATE: Calendar view (same in both list and grid view modes) ── */}
      {!isSearching && filter === "date" && (
        <ViewTransition viewKey="calendar">
          <CalendarView gridCards={gridCards} />
        </ViewTransition>
      )}

      <motion.div
        className={styles.contentWrapper}
        animate={{ opacity: openingCard ? 0 : 1 }}
        transition={{ duration: GALLERY_EXIT_DURATION, ease: EASE }}
      >
        <ViewTransition viewKey={`grid-${isSearching ? "search" : filter}`}>
        {/* ── SEARCH RESULTS ── */}
        {isSearching && (
          <div className={styles.collectionGrid} style={{ paddingTop: 36, gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
            {searchResults.length === 0 ? (
              <motion.p
                className={styles.comingSoon}
                style={{ gridColumn: "1/-1" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: CONTENT_ENTER_DURATION, ease: CONTENT_EASE }}
              >
                {t.searchNoResults}
              </motion.p>
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
              <motion.p
                className={styles.comingSoon}
                style={{ gridColumn: "1/-1" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: CONTENT_ENTER_DURATION, ease: CONTENT_EASE }}
              >
                {t.noFavorites}
              </motion.p>
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
            openMood={openMood}
            onOpen={setOpenMood}
          />
        )}

        {/* ── GRID + ALL (default) ── */}
        {!isSearching && viewMode === "grid" && filter === "all" && (
          <>
            {recentDream && (
              <>
                <p className={`${styles.sectionLabel} ${styles.sectionLabelTight}`}>{t.recentDream}</p>
                <Link
                  href={`/dream/${recentDream.id}`}
                  className={styles.heroCard}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
                    e.preventDefault();
                    openDream(recentDream);
                  }}
                >
                  <motion.div className={styles.heroImgWrap} whileTap={{ scale: 0.98 }} transition={{ duration: 0.08 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <motion.img
                      layoutId={`dream-photo-${recentDream.id}`}
                      src={recentDream.image}
                      alt=""
                      className={styles.heroImg}
                      style={{ opacity: openingCard?.id === recentDream.id ? 0 : 1 }}
                      transition={{ type: "tween", duration: 0.45, ease: EASE }}
                    />
                    <span className={styles.gridMoodTag} dir="auto">{translateMood(recentDream.mood, lang)}</span>
                    <FavoriteButton
                      filled={favorites.has(recentDream.id)}
                      onToggle={(e) => toggleFavorite(recentDream.id, e)}
                      className={styles.heartBtn}
                    />
                  </motion.div>
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
        </ViewTransition>
      </motion.div>

      </motion.div>

      {/* Stays outside the blurred/frozen wrapper so it can fade to 40%
          in place (per the transition spec) without also blurring —
          "remains visually stable throughout the transition." */}
      <motion.div
        animate={{ opacity: openingCard ? 0.4 : 1 }}
        transition={{ duration: GALLERY_EXIT_DURATION, ease: EASE }}
      >
        <BottomNav active="dreams" />
      </motion.div>

      <AnimatePresence>
        {openMood && (
          <CategoryOverlay
            mood={openMood}
            dreams={gridCards.filter((c) => c.mood === openMood)}
            stackCards={cardsByMood[openMood] ?? []}
            lang={lang}
            t={t}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onClose={() => setOpenMood(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openingCard && <DreamAnalysisOverlay card={openingCard} lang={lang} onClose={closeDream} />}
      </AnimatePresence>
    </div>
    </LayoutGroup>
  );
}
