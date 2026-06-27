import Link from "next/link";
import styles from "./DreamsByTypeScreen.module.css";
import BottomNav from "./BottomNav";
import { ArrowLeftIcon } from "./Icons";
import type { DreamEntry } from "@/dreams-store";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function DreamsByTypeScreen({ mood, dreams }: { mood: string; dreams: DreamEntry[] }) {
  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <Link href="/" className={styles.iconButton} aria-label="Back">
          <span className={styles.backIcon}>
            <ArrowLeftIcon size={20} color="currentColor" />
          </span>
        </Link>
        <p className={styles.title}>
          {mood} <span className={styles.count}>({dreams.length})</span>
        </p>
      </div>

      <div className={styles.list}>
        {dreams.length === 0 && <p className={styles.empty}>No dreams of this type yet.</p>}
        {dreams.map((dream) => (
          <Link key={dream.id} href={`/dream/${dream.id}`} className={styles.row}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.thumb} src={dream.imageUrl} alt="" />
            <div className={styles.rowText}>
              <p className={styles.rowSummary}>{dream.summaryText || mood}</p>
              <p className={styles.rowMeta}>
                {formatDate(dream.createdAt)} · {formatTime(dream.createdAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <BottomNav active="dreams" />
    </div>
  );
}
