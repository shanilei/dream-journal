"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import styles from "@/app/home.module.css";
import { ArrowLeftIcon } from "./Icons";
import FavoriteButton from "./FavoriteButton";
import { useLanguage } from "./LanguageProvider";
import { translateMood, formatDreamDate, langFromText, type Lang } from "@/i18n/translations";
import { toGalleryThumbnailUrl } from "@/lib/thumbnail";

export type CategoryOverlayCard = {
  id: string;
  image: string;
  mood: string;
  name?: string;
  createdAt: string;
  summary?: string;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Extracted out of HomeScreenClient.tsx so both the responsive Gallery
// (HomeScreenClient's own TypeGrid) and ExhibitionGallery can render it —
// having ExhibitionGallery import it directly from HomeScreenClient would
// be a circular import (HomeScreenClient already imports
// ExhibitionGallery). Destination of the TypeGrid shared-element
// transition on the responsive side (matching `type-thumb-${id}`
// layoutIds); on the exhibition side it's just opened/closed directly, no
// shared transition — stackCards is simply passed as [] there.
export function CategoryOverlay({
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
  dreams: CategoryOverlayCard[];
  stackCards: CategoryOverlayCard[];
  lang: Lang;
  t: ReturnType<typeof useLanguage>["t"];
  favorites: Set<string>;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onClose: () => void;
}) {
  const stackIds = new Set(stackCards.map((c) => c.id));
  const restDreams = dreams.filter((d) => !stackIds.has(d.id));

  function renderChrome(card: CategoryOverlayCard) {
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
              now landing in their full grid slots via layoutId (responsive
              side only — ExhibitionGallery always passes stackCards=[]). */}
          {stackCards.map((card) => (
            <div key={card.id} className={styles.gridCard} style={{ position: "relative" }}>
              <div className={styles.sharedThumbSlot}>
                <motion.img
                  layoutId={`type-thumb-${card.id}`}
                  src={toGalleryThumbnailUrl(card.image)}
                  alt=""
                  className={styles.sharedThumbImg}
                  style={{ rotate: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  loading="lazy"
                  decoding="async"
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
              <Link href={`/dream/${card.id}`} prefetch={false} className={styles.sharedCardTapArea} aria-label={card.name || translateMood(card.mood, lang)} />
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
                <Link href={`/dream/${card.id}`} prefetch={false} className={styles.gridCard}>
                  <div className={styles.gridImgWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={toGalleryThumbnailUrl(card.image)} alt="" className={styles.gridImg} loading="lazy" decoding="async" />
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
