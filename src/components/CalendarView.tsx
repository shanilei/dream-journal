"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import styles from "@/app/home.module.css";
import { useLanguage } from "./LanguageProvider";
import { toGalleryThumbnailUrl } from "@/lib/thumbnail";

export type CalendarViewCard = {
  id: string;
  image: string;
  mood: string;
  name?: string;
  createdAt: string;
  summary?: string;
};

const DAY_LABELS_EN = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_LABELS_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const CONTENT_EASE = "easeInOut";
const CONTENT_ENTER_DURATION = 0.2;

// Extracted out of HomeScreenClient.tsx so both the responsive Gallery and
// ExhibitionGallery can render it — ExhibitionGallery importing directly
// from HomeScreenClient would be a circular import (HomeScreenClient
// already imports ExhibitionGallery).
export function CalendarView({ gridCards }: { gridCards: CalendarViewCard[] }) {
  const { lang } = useLanguage();
  const DAY_LABELS = lang === "he" ? DAY_LABELS_HE : DAY_LABELS_EN;

  const dreamsByDate = gridCards.reduce<Record<string, CalendarViewCard>>((acc, card) => {
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
                            <Link href={`/dream/${dream.id}`} prefetch={false} className={`${styles.calCell} ${isToday ? styles.calCellSelected : ""}`}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={toGalleryThumbnailUrl(dream.image)} alt="" className={styles.calCellImg} loading="lazy" decoding="async" />
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
