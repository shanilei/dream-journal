"use client";

import styles from "./GalleryFilterChips.module.css";
import { SparkleIcon } from "./Icons";
import { useLanguage } from "./LanguageProvider";

export type GalleryFilter = "all" | "byType" | "latest" | "analysis";

export default function GalleryFilterChips({
  active,
  onChange,
}: {
  active: GalleryFilter;
  onChange: (filter: GalleryFilter) => void;
}) {
  const { t } = useLanguage();

  const chips: { key: GalleryFilter; label: string }[] = [
    { key: "all", label: t.filterAll },
    { key: "byType", label: t.byType },
    { key: "latest", label: t.filterLatest },
    { key: "analysis", label: t.filterAnalysis },
  ];

  return (
    <div className={styles.row}>
      {chips.map((chip) => {
        const isActive = chip.key === active;
        return (
          <button
            key={chip.key}
            type="button"
            className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
            aria-pressed={isActive}
            onClick={() => onChange(chip.key)}
          >
            <span className={styles.chipIcon}>
              <SparkleIcon size={12} color={isActive ? "#333" : "#fff"} />
            </span>
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
