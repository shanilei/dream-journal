"use client";

import { useRouter } from "next/navigation";
import styles from "./DreamGridView.module.css";
import { useLanguage } from "./LanguageProvider";
import { translateMood, formatDreamDate, formatDreamTime } from "@/i18n/translations";
import type { DreamCard } from "./DreamCardStack";

export default function DreamGridView({ cards }: { cards: DreamCard[] }) {
  const router = useRouter();
  const { lang } = useLanguage();

  if (cards.length === 0) {
    return <p className={styles.empty}>No dreams yet.</p>;
  }

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          className={styles.box}
          onClick={() => router.push(`/dream/${card.id}`)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.boxImg} src={card.image} alt="" draggable={false} />
          <div className={styles.boxFooter}>
            <span className={styles.moodTag}>{translateMood(card.mood, lang)}</span>
            <span className={styles.metaGroup}>
              <span className={styles.metaText}>{formatDreamDate(card.createdAt, lang)}</span>
              <span className={styles.metaText}>{formatDreamTime(card.createdAt, lang)}</span>
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
