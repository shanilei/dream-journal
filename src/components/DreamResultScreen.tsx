"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DreamResultScreen.module.css";
import { ArrowLeftIcon, ShareIcon, PrinterIcon } from "./Icons";

function getFiveWordCaption(text: string): string {
  return text
    .replace(/[.,!?]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .join(" ");
}

export default function DreamResultScreen({
  imageUrl,
  dateLabel,
  timeLabel,
  mood,
  summaryText,
  symbols,
  onBack,
}: {
  imageUrl: string;
  dateLabel: string;
  timeLabel?: string;
  mood: string;
  summaryText: string;
  symbols: string[];
  onBack: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [textColor, setTextColor] = useState<"white" | "black">("white");
  const captionText = getFiveWordCaption(summaryText);

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
          <button type="button" className={styles.iconButton} aria-label="Print">
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
            <div className={textColor === "white" ? styles.imageScrimDark : styles.imageScrimLight} />
            {captionText && (
              <div className={styles.captionOverlay}>
                <p className={`${styles.captionText} ${textColor === "black" ? styles.captionTextDark : ""}`}>
                  {captionText}
                </p>
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
            <p className={styles.bodyText}>{summaryText}</p>
          </div>
        )}

        {symbols.length > 0 && (
          <div className={styles.block}>
            <p className={styles.blockHeading}>Symbols in your dream</p>
            {symbols.map((symbol, i) => (
              <p key={i} className={styles.bodyText}>
                {symbol}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
