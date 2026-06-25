import styles from "./home.module.css";
import BottomNav from "@/components/BottomNav";
import DreamCardStack from "@/components/DreamCardStack";
import GlassEffect from "@/components/GlassEffect";
import OnboardingGate from "@/components/OnboardingGate";
import { FilterIcon, LayoutGalleryIcon, TableChartIcon } from "@/components/Icons";
import { listDreams } from "@/dreams-store";

const CATEGORIES = [
  { label: "Fear", count: 220 },
  { label: "Love", count: 150 },
  { label: "Confusion", count: 300 },
  { label: "Confusion", count: 300 },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default async function HomePage() {
  const cards = (await listDreams())
    .slice(0, 3)
    .map((dream) => ({
      id: dream.id,
      image: dream.imageUrl,
      mood: dream.mood,
      date: formatDate(dream.createdAt),
      time: formatTime(dream.createdAt),
    }));

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

      <p className={styles.heading}>Latest Dreams</p>

      <DreamCardStack cards={cards} />

      <div className={styles.byType}>
        <div className={styles.byTypeHeaderRow}>
          <p className={styles.byTypeHeading}>By type</p>
          <a className={styles.seeAll} href="#">
            See all
          </a>
        </div>
        <div className={styles.categoryRow}>
          {CATEGORIES.map((cat, i) => (
            <div key={i} className={styles.categoryCard}>
              <p className={styles.categoryLabel}>{cat.label}</p>
              <p className={styles.categoryCount}>{cat.count} Dreams</p>
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="dreams" />
    </div>
  );
}
