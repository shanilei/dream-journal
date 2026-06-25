"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DreamResultScreen.module.css";
import { ArrowLeftIcon, ShareIcon, PrinterIcon } from "./Icons";
import BottomNav from "./BottomNav";

const CAPTION_MAX_WORDS = 7;

function getCaptionWords(text: string, maxWords: number): string {
  return text
    .replace(/[.,!?]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join(" ");
}

type CaptionLayout = "center" | "bottom";

function pickCaptionLayout(seed: string): CaptionLayout {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % 4 === 0 ? "bottom" : "center";
}

function CollapsibleText({ text, dark }: { text: string; dark: boolean }) {
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
          {expanded ? "Read less" : "Read more"}
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
  const imgRef = useRef<HTMLImageElement>(null);
  const [textColor, setTextColor] = useState<"white" | "black">("white");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const captionText = getCaptionWords(summaryText, CAPTION_MAX_WORDS);
  const captionLayout = pickCaptionLayout(imageUrl);

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
        <button type="button" className={styles.iconButton} onClick={onBack} aria-label="Back">
          <ArrowLeftIcon size={20} color="currentColor" />
        </button>
        <div className={styles.topBarRight}>
          <button type="button" className={styles.iconButton} aria-label="Share">
            <ShareIcon size={16} color="currentColor" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Print"
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
                <div className={styles.captionMeta}>
                  <span
                    className={`${styles.captionMetaText} ${
                      textColor === "black" ? styles.captionMetaTextDark : ""
                    }`}
                  >
                    {dateLabel}
                  </span>
                  {timeLabel && (
                    <span
                      className={`${styles.captionMetaText} ${
                        textColor === "black" ? styles.captionMetaTextDark : ""
                      }`}
                    >
                      {timeLabel}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.titleBlock}>
          <p className={styles.title}>{dateLabel} dream</p>
          <div className={styles.metaRow}>
            <span className={styles.moodPill}>{mood}</span>
            <span className={styles.metaText}>{dateLabel}</span>
            {timeLabel && <span className={styles.metaText}>{timeLabel}</span>}
          </div>
        </div>

        {summaryText && (
          <div className={styles.block}>
            <p className={styles.blockHeading}>What does it say?</p>
            <CollapsibleText text={summaryText} dark={false} />
          </div>
        )}

        {symbols.length > 0 && (
          <div className={styles.block}>
            <p className={styles.blockHeading}>Symbols in your dream</p>
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
            <p className={styles.blockHeading}>The dream itself</p>
            <CollapsibleText text={dreamText} dark={false} />
          </div>
        )}
      </div>

      <BottomNav active="dreams" />

      {showPrintModal && (
        <div className={styles.printModalOverlay} onClick={() => setShowPrintModal(false)}>
          <div className={styles.printModalCard} onClick={(e) => e.stopPropagation()}>
            <p className={styles.printModalTitle}>To print your dream?</p>
            <div className={styles.printModalActions}>
              <button type="button" className={styles.printModalCancel} onClick={() => setShowPrintModal(false)}>
                Cancel
              </button>
              <button type="button" className={styles.printModalConfirm} onClick={handlePrint}>
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
