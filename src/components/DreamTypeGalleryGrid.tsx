"use client";

import Link from "next/link";
import styles from "./DreamTypeGalleryGrid.module.css";
import { CrescentMoonIcon } from "./Icons";
import { useLanguage } from "./LanguageProvider";
import { translateMood } from "@/i18n/translations";

type Category = {
  label: string;
  count: number;
};

const CARD_CLASS: Record<string, string> = {
  Sweet: styles.cardSweet,
  Fear: styles.cardFear,
  Confused: styles.cardConfused,
  Sad: styles.cardSad,
  Angry: styles.cardAngry,
};

export default function DreamTypeGalleryGrid({ categories }: { categories: Category[] }) {
  const { t, lang } = useLanguage();

  return (
    <div className={styles.grid}>
      {categories.map((cat) => (
        <Link
          key={cat.label}
          href={`/type/${encodeURIComponent(cat.label)}`}
          className={`${styles.card} ${CARD_CLASS[cat.label] ?? ""}`}
        >
          <span className={styles.moonIcon}>
            <CrescentMoonIcon size={40} color="#fff" />
          </span>
          <p className={styles.cardLabel}>{translateMood(cat.label, lang)}</p>
          <p className={styles.cardCount}>
            {cat.count} {t.dreamsCount}
          </p>
        </Link>
      ))}
    </div>
  );
}
