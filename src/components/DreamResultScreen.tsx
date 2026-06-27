"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DreamResultScreen.module.css";
import { ArrowLeftIcon, ShareIcon, PrinterIcon } from "./Icons";
import BottomNav from "./BottomNav";
import { useLanguage } from "./LanguageProvider";

const CAPTION_MAX_WORDS = 7;
const CAPTION_WORDS_PER_LINE = 4;

function capitalizeFirst(text: string): string {
  return text.length ? text[0].toUpperCase() + text.slice(1) : text;
}

function getCaptionWords(text: string, maxWords: number): string {
  const words = text
    .replace(/[.,!?]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords);

  const lines: string[] = [];
  for (let i = 0; i < words.length; i += CAPTION_WORDS_PER_LINE) {
    lines.push(words.slice(i, i + CAPTION_WORDS_PER_LINE).join(" "));
  }
  return capitalizeFirst(lines.join("\n"));
}

type CaptionLayout = "center" | "bottom";

function pickCaptionLayout(seed: string): CaptionLayout {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % 4 === 0 ? "bottom" : "center";
}

function CollapsibleText({ text, dark }: { text: string; dark: boolean }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (el) setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  return (
    <div className={styles.collapsibleBlock}>
      <p
        ref={textRef}
        className={`${styles.bodyText} ${expanded ? "" : styles.bodyTextClamped} ${
          dark ? styles.bodyTextDark : ""
        }`}
      >
        {text}
      </p>
      {(overflowing || expanded) && (
        <button type="button" className={styles.readMoreBtn} onClick={() => setExpanded((v) => !v)}>
          {expanded ? t.readLess : t.readMore}
        </button>
      )}
    </div>
  );
}

export default function DreamResultScreen({
  imageUrl,
  dateLabel,
  timeLabel,
  mood,
  summaryText,
  symbols,
  dreamText,
  onBack,
}: {
  imageUrl: string;
  dateLabel: string;
  timeLabel?: string;
  mood: string;
  summaryText: string;
  symbols: string[];
  dreamText?: string;
  onBack: () => void;
}) {
  const { lang, t } = useLanguage();
  const imgRef = useRef<HTMLImageElement>(null);
  const [textColor, setTextColor] = useState<"white" | "black">("white");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const captionText = getCaptionWords(summaryText, CAPTION_MAX_WORDS);
  const captionLayout = pickCaptionLayout(imageUrl);
  const dreamTitle = lang === "he" ? `${t.dreamTitleSuffix} ${dateLabel}` : `${dateLabel} ${t.dreamTitleSuffix}`;

  function sampleBrightness() {
    const img = imgRef.current;
    if (!img) return;
    try {
      const w = 40;
      const h = 40;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Sample only the right half, where the caption overlay sits.
      ctx.drawImage(img, img.naturalWidth * 0.5, 0, img.naturalWidth * 0.5, img.naturalHeight, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      let total = 0;
      for (let i = 0; i < data.length; i += 4) {
        total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      setTextColor(total / (data.length / 4) > 140 ? "black" : "white");
    } catch {
      // Cross-origin images taint the canvas — keep the default color.
    }
  }

  useEffect(() => {
    if (imgRef.current?.complete) sampleBrightness();
  }, [imageUrl]);

  function handlePrint() {
    setShowPrintModal(false);
    window.print();
  }

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <button type="button" className={styles.iconButton} onClick={onBack} aria-label={t.back}>
          <span className={styles.backIcon}>
            <ArrowLeftIcon size={20} color="currentColor" />
          </span>
        </button>
        <div className={styles.topBarRight}>
          <button type="button" className={styles.iconButton} aria-label={t.share}>
            <ShareIcon size={16} color="currentColor" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={t.print}
            onClick={() => setShowPrintModal(true)}
          >
            <PrinterIcon size={16} color="currentColor" />
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.imageCard}>
          <div className={styles.imageWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              className={styles.image}
              src={imageUrl}
              alt="Generated dream artwork"
              onLoad={sampleBrightness}
            />
            <div className={styles.imageFrost} />
            <div className={textColor === "white" ? styles.imageScrimDark : styles.imageScrimLight} />
            {(captionText || dateLabel) && (
              <div
                className={`${styles.captionOverlay} ${
                  captionLayout === "center" ? styles.captionOverlayCenter : styles.captionOverlayBottom
                }`}
              >
                {captionText && (
                  <p className={`${styles.captionText} ${textColor === "black" ? styles.captionTextDark : ""}`}>
                    {captionText}
                  </p>
                )}
                <div className={styles.captionMetaGroup}>
                  {captionText && dateLabel && (
                    <div
                      className={`${styles.captionDivider} ${
                        textColor === "black" ? styles.captionDividerDark : ""
                      }`}
                    />
                  )}
                  <div className={styles.captionMeta}>
                    <span
                      dir="ltr"
                      className={`${styles.captionMetaDate} ${
                        textColor === "black" ? styles.captionMetaDark : ""
                      }`}
                    >
                      {dateLabel}
                    </span>
                    {timeLabel && (
                      <span
                        dir="ltr"
                        className={`${styles.captionMetaTime} ${
                          textColor === "black" ? styles.captionMetaDark : ""
                        }`}
                      >
                        {timeLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.titleBlock}>
          <p className={styles.title}>{dreamTitle}</p>
          <div className={styles.metaRow}>
            <span className={styles.moodPill}>{mood}</span>
            <span className={styles.metaText}>{dateLabel}</span>
            {timeLabel && <span className={styles.metaText}>{timeLabel}</span>}
          </div>
        </div>

        {summaryText && (
          <div className={styles.block}>
            <p className={styles.blockHeading}>{t.whatDoesItSay}</p>
            <CollapsibleText text={summaryText} dark={false} />
          </div>
        )}

        {symbols.length > 0 && (
          <div className={styles.block}>
            <p className={styles.blockHeading}>{t.symbolsInYourDream}</p>
            <div className={styles.symbolsRow}>
              {symbols.map((symbol, i) => (
                <span key={i} className={styles.symbolChip}>
                  {symbol}
                </span>
              ))}
            </div>
          </div>
        )}

        {dreamText && (
          <div className={styles.block}>
            <p className={styles.blockHeading}>{t.theDreamItself}</p>
            <CollapsibleText text={dreamText} dark={false} />
          </div>
        )}
      </div>

      <BottomNav active="dreams" />

      {showPrintModal && (
        <div className={styles.printModalOverlay} onClick={() => setShowPrintModal(false)}>
          <div className={styles.printModalCard} onClick={(e) => e.stopPropagation()}>
            <p className={styles.printModalTitle}>{t.printConfirmTitle}</p>
            <div className={styles.printModalActions}>
              <button type="button" className={styles.printModalCancel} onClick={() => setShowPrintModal(false)}>
                {t.cancel}
              </button>
              <button type="button" className={styles.printModalConfirm} onClick={handlePrint}>
                {t.print}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
