"use client";

import Link from "next/link";
import styles from "./DreamsByTypeScreen.module.css";
import BottomNav from "./BottomNav";
import { ArrowLeftIcon } from "./Icons";
import { useLanguage } from "./LanguageProvider";
import { translateMood, formatDreamDate, langFromText } from "@/i18n/translations";
import type { DreamEntry } from "@/dreams-store";

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

export default function DreamsByTypeScreen({ mood, dreams }: { mood: string; dreams: DreamEntry[] }) {
  const { lang } = useLanguage();

  return (
    <div className={styles.screen}>
      {/* Nebulas */}
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

      {/* Header */}
      <div className={styles.header}>
        <Link href="/gallery" className={styles.iconBtn} aria-label="Back">
          <ArrowLeftIcon size={16} color="currentColor" />
        </Link>
        <p className={styles.title}>{translateMood(mood, lang)}</p>
        <button type="button" className={styles.iconBtn} aria-label="Options">
          <MoreIcon />
        </button>
      </div>

      {/* 2-column grid */}
      <div className={styles.grid}>
        {dreams.length === 0 && (
          <p className={styles.empty}>No dreams of this type yet.</p>
        )}
        {dreams.map((dream) => (
          <Link key={dream.id} href={`/dream/${dream.id}`} className={styles.card}>
            <div className={styles.imgWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={dream.imageUrl} alt="" className={styles.img} />
              <button
                type="button"
                className={styles.heartBtn}
                aria-label="Favourite"
                onClick={(e) => e.preventDefault()}
              >
                <HeartIcon />
              </button>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.cardHeading}>{translateMood(dream.mood ?? mood, lang)}</p>
              <p className={styles.cardSub}>{formatDreamDate(dream.createdAt, langFromText(dream.summaryText, lang))}</p>
            </div>
          </Link>
        ))}
      </div>

      <BottomNav active="dreams" />
    </div>
  );
}
