"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DreamResultScreen.module.css";
import { ArrowLeftIcon, ShareIcon, PrinterIcon } from "./Icons";
import BottomNav from "./BottomNav";
import { useLanguage } from "./LanguageProvider";
import { usePhotoBorder } from "./PhotoBorderProvider";
import { translateMood, formatDreamDate, formatDreamTime } from "@/i18n/translations";

const CAPTION_MAX_WORDS = 7;
function capitalizeFirst(text: string): string {
  return text.length ? text[0].toUpperCase() + text.slice(1) : text;
}

const CAPTION_WORDS_PER_LINE = 4;

function getCaptionWords(text: string, maxWords: number): string {
  const words = text
    .replace(/[.,!?\-–—]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords);

  const lines: string[] = [];
  for (let i = 0; i < words.length; i += CAPTION_WORDS_PER_LINE) {
    lines.push(words.slice(i, i + CAPTION_WORDS_PER_LINE).join(' '));
  }

  // Prevent orphaned single word on the last line.
  if (lines.length >= 2) {
    const lastWords = lines[lines.length - 1].split(' ');
    if (lastWords.length === 1) {
      // Steal one word from the previous line so last line has 2 words.
      const prevWords = lines[lines.length - 2].split(' ');
      const stolen = prevWords.pop()!;
      lines[lines.length - 2] = prevWords.join(' ');
      lines[lines.length - 1] = stolen + ' ' + lastWords[0];
    } else {
      // Tie the last two words so the final word can never wrap alone.
      lastWords[lastWords.length - 2] =
        lastWords[lastWords.length - 2] + ' ' + lastWords[lastWords.length - 1];
      lastWords.pop();
      lines[lines.length - 1] = lastWords.join(' ');
    }
  }

  return capitalizeFirst(lines.join('\n'));
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
        dir="auto"
        className={`${styles.bodyText} ${expanded ? "" : styles.bodyTextClamped} ${
          dark ? styles.bodyTextDark : ""
        }`}
      >
        {text.replace(/\n+/g, " ")}
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
  clearImageUrl,
  createdAt,
  mood,
  summaryText,
  interpretationText,
  symbols,
  dreamText,
  onBack,
}: {
  imageUrl: string;
  clearImageUrl?: string;
  createdAt: string;
  mood: string;
  summaryText: string;
  interpretationText?: string;
  symbols: string[];
  dreamText?: string;
  onBack: () => void;
}) {
  const { lang, t } = useLanguage();
  const { showBorder } = usePhotoBorder();
  const imgRef = useRef<HTMLImageElement>(null);
  const [textColor, setTextColor] = useState<"white" | "black">("white");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isHebrew = /[֐-׿]/.test(dreamText || summaryText || "");
  const captionText = getCaptionWords(summaryText, CAPTION_MAX_WORDS);
  const captionLines = captionText ? captionText.split("\n") : [];
  const captionLayout = pickCaptionLayout(imageUrl);
  const dateLang = isHebrew ? "he" : lang;
  const dateLabel = formatDreamDate(createdAt, dateLang);
  const timeLabel = formatDreamTime(createdAt, dateLang);
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

  async function handlePrint() {
    setShowPrintModal(false);

    // Open window synchronously — iOS Safari blocks window.open() called after any await
    const win = window.open("", "_blank");
    if (!win) {
      setTimeout(() => window.print(), 50);
      return;
    }

    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const captionFont = isHebrew
        ? `'Ploni AAA', Arial, serif`
        : `'Alumni Sans', 'Helvetica Neue', Arial, sans-serif`;
      const scrimGradient =
        textColor === "white"
          ? isHebrew
            ? "linear-gradient(to right, rgba(0,0,0,0.4), transparent 65%)"
            : "linear-gradient(to left, rgba(0,0,0,0.4), transparent 65%)"
          : isHebrew
          ? "linear-gradient(to right, rgba(255,255,255,0.45), transparent 65%)"
          : "linear-gradient(to left, rgba(255,255,255,0.45), transparent 65%)";
      const fg = textColor === "white" ? "#fff" : "#000";
      const fgMuted = textColor === "white" ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)";
      const captionAlignItems = captionLayout === "center" ? "center" : "flex-end";
      const captionHtml = captionLines
        .map((line) => `<span style="display:block">${line}</span>`)
        .join("");

      win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alumni+Sans:wght@400;600&family=David+Libre:wght@400;700&display=swap">
<style>
@page{margin:0}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden}
.w{position:fixed;inset:0;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.scrim{position:absolute;inset:0;background:${scrimGradient}}
.cap{position:absolute;inset:0;display:flex;flex-direction:${isHebrew ? "row-reverse" : "row"};justify-content:space-between;align-items:${captionAlignItems};gap:16px;padding:20px;direction:${isHebrew ? "rtl" : "ltr"}}
.ct{flex:1;font-family:${captionFont};font-size:12px;font-weight:400;line-height:1.4;color:${fg}}
.cm{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0}
.cd{font-family:${captionFont};font-size:13px;font-weight:600;color:${fg};white-space:nowrap}
.ctm{font-family:${captionFont};font-size:11px;font-weight:600;color:${fgMuted};white-space:nowrap}
</style>
</head>
<body>
<div class="w">
<img class="img" src="${dataUrl}">
<div class="scrim"></div>
<div class="cap">
<p class="ct">${captionHtml}</p>
<div class="cm"><span class="cd">${dateLabel}</span><span class="ctm">${timeLabel}</span></div>
</div>
</div>
</body>
</html>`);
      win.document.close();

      setTimeout(() => {
        win.focus();
        win.print();
        setTimeout(() => win.close(), 1000);
      }, 700);
    } catch {
      win.close();
      setTimeout(() => window.print(), 50);
    }
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
        <div className={`${styles.imageCard} ${showBorder ? "" : styles.imageCardNoBorder}`}>
          <div
            className={styles.imageWrap}
            onMouseEnter={() => clearImageUrl && setRevealed(true)}
            onMouseLeave={() => setRevealed(false)}
            onTouchStart={() => clearImageUrl && setRevealed(true)}
            onTouchEnd={() => setRevealed(false)}
            onTouchCancel={() => setRevealed(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              className={styles.image}
              src={imageUrl}
              alt="Generated dream artwork"
              onLoad={sampleBrightness}
            />
            {clearImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={`${styles.imageClear} ${revealed ? styles.imageClearRevealed : ""}`}
                src={clearImageUrl}
                alt=""
                aria-hidden="true"
              />
            )}
            <div
              className={`${textColor === "white" ? styles.imageScrimDark : styles.imageScrimLight} ${
                revealed ? styles.imageOverlayHidden : ""
              }`}
            />
            {(captionText || dateLabel) && (
              <div
                className={`${styles.captionOverlay} ${
                  captionLayout === "center" ? styles.captionOverlayCenter : styles.captionOverlayBottom
                } ${isHebrew ? styles.captionOverlayRtl : ""} ${revealed ? styles.imageOverlayHidden : ""}`}
              >
                {captionLines.length > 0 && (
                  <p className={`${styles.captionText} ${isHebrew ? styles.captionTextHe : ""} ${textColor === "black" ? styles.captionTextDark : ""}`}>
                    {captionLines.map((line, i) => (
                      <span
                        key={i}
                        className={i === captionLines.length - 1 ? styles.captionLineLast : styles.captionLine}
                      >
                        {line}
                      </span>
                    ))}
                  </p>
                )}
                <div className={styles.captionMeta}>
                  <span className={`${styles.captionMetaDate} ${isHebrew ? styles.captionMetaDateHe : ""} ${textColor === "black" ? styles.captionMetaDark : ""}`}>
                    {dateLabel}
                  </span>
                  {timeLabel && (
                    <span className={`${styles.captionMetaTime} ${isHebrew ? styles.captionMetaDateHe : ""} ${textColor === "black" ? styles.captionMetaDark : ""}`}>
                      {timeLabel}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.titleBlock}>
          <p className={styles.title}>{dreamTitle}</p>
          <div className={styles.metaRow}>
            <span className={styles.moodPill}>{translateMood(mood, lang)}</span>
            <span className={styles.metaText}>{dateLabel}</span>
            {timeLabel && <span className={styles.metaText}>{timeLabel}</span>}
          </div>
        </div>

        {(interpretationText || summaryText) && (
          <div className={styles.block}>
            <p className={styles.blockHeading}>{t.whatDoesItSay}</p>
            <CollapsibleText text={interpretationText || summaryText} dark={false} />
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
