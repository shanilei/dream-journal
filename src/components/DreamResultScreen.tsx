"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DreamResultScreen.module.css";
import { ArrowLeftIcon, ShareIcon, PrinterIcon, HeartIcon } from "./Icons";
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

const FAVORITES_KEY = "dream-favorites";

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveFavorites(set: Set<string>) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

export default function DreamResultScreen({
  id,
  name,
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
  id?: string;
  name?: string;
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
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (id) setFavorited(loadFavorites().has(id));
  }, [id]);

  function toggleFavorite() {
    if (!id) return;
    setFavorited((prev) => {
      const next = !prev;
      const set = loadFavorites();
      next ? set.add(id) : set.delete(id);
      saveFavorites(set);
      return next;
    });
  }
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [textColor, setTextColor] = useState<"white" | "black">("white");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const REVEAL_RADIUS = 40; // 80px spotlight
  const targetMaskRef = useRef({ x: 0, y: 0, r: 0 });
  const displayMaskRef = useRef({ x: 0, y: 0, r: 0 });
  // Trails behind the main circle with slower easing and a larger target
  // radius, so it visually "lags" and gets dragged along — the pull effect.
  const trailMaskRef = useRef({ x: 0, y: 0, r: 0 });
  const maskRafRef = useRef<number | null>(null);

  useEffect(() => {
    function tick() {
      const target = targetMaskRef.current;
      const display = displayMaskRef.current;
      display.x += (target.x - display.x) * 0.22;
      display.y += (target.y - display.y) * 0.22;
      display.r += (target.r - display.r) * 0.15;

      const trail = trailMaskRef.current;
      trail.x += (target.x - trail.x) * 0.07;
      trail.y += (target.y - trail.y) * 0.07;
      trail.r += (target.r * 1.4 - trail.r) * 0.06;

      const el = wrapRef.current;
      if (el) {
        el.style.setProperty("--mask-x", `${display.x}px`);
        el.style.setProperty("--mask-y", `${display.y}px`);
        el.style.setProperty("--mask-r", `${display.r}px`);
        el.style.setProperty("--trail-x", `${trail.x}px`);
        el.style.setProperty("--trail-y", `${trail.y}px`);
        el.style.setProperty("--trail-r", `${trail.r}px`);
      }
      maskRafRef.current = requestAnimationFrame(tick);
    }
    maskRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (maskRafRef.current) cancelAnimationFrame(maskRafRef.current);
    };
  }, []);

  function updateMaskPos(clientX: number, clientY: number) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    targetMaskRef.current.x = clientX - rect.left;
    targetMaskRef.current.y = clientY - rect.top;
  }
  const [copied, setCopied] = useState(false);
  const isHebrew = /[֐-׿]/.test(dreamText || summaryText || "");
  const captionText = getCaptionWords(summaryText, CAPTION_MAX_WORDS);
  const captionLines = captionText ? captionText.split("\n") : [];
  const captionLayout = pickCaptionLayout(imageUrl);
  const dateLang = isHebrew ? "he" : lang;
  const dateLabel = formatDreamDate(createdAt, dateLang);
  const timeLabel = formatDreamTime(createdAt, dateLang);
  const dreamTitle = name || (lang === "he" ? `${t.dreamTitleSuffix} ${dateLabel}` : `${dateLabel} ${t.dreamTitleSuffix}`);

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

  async function handleShare() {
    const url = id ? `${window.location.origin}/dream/${id}` : window.location.href;
    const shareData = {
      title: dreamTitle,
      text: interpretationText || summaryText,
      url,
    };
    if (typeof navigator.share === "function" && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // user dismissed — do nothing
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // clipboard unavailable
      }
    }
  }

  function handlePrint() {
    setShowPrintModal(false);

    const win = window.open("", "_blank");
    if (!win) {
      setTimeout(() => window.print(), 50);
      return;
    }

    try {
      // Mirrors DreamResultScreen.module.css so the printed card matches
      // what's on screen: same border style, scrim, and caption layout.
      const captionFont = isHebrew
        ? `'Ploni Print', Arial, serif`
        : `'Alumni Sans', 'Helvetica Neue', Arial, sans-serif`;
      const scrimSide = isHebrew ? "to right" : "to left";
      const scrimGradient =
        textColor === "white"
          ? `linear-gradient(${scrimSide}, rgba(0,0,0,0.4), transparent 65%)`
          : `linear-gradient(${scrimSide}, rgba(255,255,255,0.45), transparent 65%)`;
      const fg = textColor === "white" ? "#fff" : "#000";
      const dateColor = fg;
      const timeColor =
        textColor === "black" ? "rgba(0,0,0,0.55)" : isHebrew ? "#fff" : "rgba(255,255,255,0.65)";
      const timeFontSize = isHebrew ? 13 : 11;
      const captionAlignItems = captionLayout === "center" ? "center" : "flex-end";
      const captionHtml = captionLines.map((line) => `<span class="cl">${line}</span>`).join("");
      const origin = window.location.origin;

      win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alumni+Sans:wght@400;600&display=swap">
<style>
@font-face{
  font-family:'Ploni Print';
  src:url('${origin}/fonts/ploni-regular-aaa.otf') format('opentype');
  font-weight:400;
}
@font-face{
  font-family:'Ploni Print';
  src:url('${origin}/fonts/ploni-demibold-aaa.otf') format('opentype');
  font-weight:600;
}
@page{margin:24px}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%}
body{display:flex;align-items:center;justify-content:center;background:#fff}
.card{
  width:400px;
  background:${showBorder ? "#fff" : "transparent"};
  padding:${showBorder ? "16px 8px 74px" : "0"};
  print-color-adjust:exact;-webkit-print-color-adjust:exact;
}
.wrap{position:relative;width:100%;aspect-ratio:338/475}
.img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;border-radius:26px}
.scrim{position:absolute;inset:0;border-radius:26px;background:${scrimGradient}}
.cap{position:absolute;inset:0;display:flex;flex-direction:${isHebrew ? "row-reverse" : "row"};justify-content:space-between;align-items:${captionAlignItems};gap:16px;padding:20px;direction:${isHebrew ? "rtl" : "ltr"}}
.ct{flex:1;font-family:${captionFont};font-size:12px;font-weight:400;line-height:1.4;letter-spacing:0.4px;color:${fg}}
.cl{display:block;text-align:start}
.cm{display:flex;flex-direction:column;align-items:${isHebrew ? "flex-start" : "flex-end"};gap:2px;flex-shrink:0}
.cd{font-family:${captionFont};font-size:13px;font-weight:600;line-height:1.3;color:${dateColor};white-space:nowrap}
.ctm{font-family:${captionFont};font-size:${timeFontSize}px;font-weight:600;line-height:1.3;color:${timeColor};white-space:nowrap}
</style>
</head>
<body>
<div class="card">
<div class="wrap">
<img class="img" id="printImg" src="${imageUrl}">
<div class="scrim"></div>
<div class="cap">
<p class="ct">${captionHtml}</p>
<div class="cm"><span class="cd">${dateLabel}</span>${timeLabel ? `<span class="ctm">${timeLabel}</span>` : ""}</div>
</div>
</div>
</div>
<script>
Promise.all([
  document.fonts ? document.fonts.ready : Promise.resolve(),
  new Promise(function (resolve) {
    var img = document.getElementById('printImg');
    if (img.complete) resolve();
    else { img.onload = resolve; img.onerror = resolve; }
  })
]).then(function () {
  window.focus();
  window.print();
  setTimeout(function () { window.close(); }, 1000);
});
</script>
</body>
</html>`);
      win.document.close();
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
          <button type="button" className={styles.iconButton} aria-label={t.share} onClick={handleShare}>
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
            ref={wrapRef}
            className={styles.imageWrap}
            onMouseEnter={(e) => {
              if (!clearImageUrl) return;
              updateMaskPos(e.clientX, e.clientY);
              targetMaskRef.current.r = REVEAL_RADIUS;
              setRevealed(true);
            }}
            onMouseMove={(e) => revealed && updateMaskPos(e.clientX, e.clientY)}
            onMouseLeave={() => {
              targetMaskRef.current.r = 0;
              setRevealed(false);
            }}
            onTouchStart={(e) => {
              if (!clearImageUrl) return;
              const touch = e.touches[0];
              if (touch) updateMaskPos(touch.clientX, touch.clientY);
              targetMaskRef.current.r = REVEAL_RADIUS;
              setRevealed(true);
            }}
            onTouchMove={(e) => {
              if (!revealed) return;
              const touch = e.touches[0];
              if (touch) updateMaskPos(touch.clientX, touch.clientY);
            }}
            onTouchEnd={() => {
              targetMaskRef.current.r = 0;
              setRevealed(false);
            }}
            onTouchCancel={() => {
              targetMaskRef.current.r = 0;
              setRevealed(false);
            }}
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
              <img className={styles.imageClearTrail} src={clearImageUrl} alt="" aria-hidden="true" />
            )}
            {clearImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={styles.imageClear}
                src={clearImageUrl}
                alt=""
                aria-hidden="true"
              />
            )}
            <div className={textColor === "white" ? styles.imageScrimDark : styles.imageScrimLight} />
            {(captionText || dateLabel) && (
              <div
                className={`${styles.captionOverlay} ${
                  captionLayout === "center" ? styles.captionOverlayCenter : styles.captionOverlayBottom
                } ${isHebrew ? styles.captionOverlayRtl : ""}`}
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
                    <span className={`${styles.captionMetaTime} ${isHebrew ? styles.captionMetaTimeHe : ""} ${textColor === "black" ? styles.captionMetaDark : ""}`}>
                      {timeLabel}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.titleBlock} style={lang === "he" ? { alignItems: "flex-end", width: "100%" } : undefined}>
          <div className={styles.titleRow}>
            <p className={styles.title}>{dreamTitle}</p>
            <button type="button" className={styles.titleHeartBtn} aria-label="Favourite" onClick={toggleFavorite}>
              <HeartIcon size={22} color="#ffffff" filled={favorited} />
            </button>
          </div>
          <div className={styles.metaRow} style={lang === "he" ? { justifyContent: "flex-end", width: "100%" } : undefined}>
            <span className={styles.moodPill}>{translateMood(mood, lang)}</span>
            <span className={styles.metaText}>{dateLabel}</span>
            {timeLabel && <span className={styles.metaText}>{timeLabel}</span>}
          </div>
        </div>

        {(interpretationText || summaryText) && (
          <div className={styles.block} style={lang === "he" ? { alignItems: "flex-end", width: "100%" } : undefined}>
            <p className={styles.blockHeading}>{t.whatDoesItSay}</p>
            <CollapsibleText text={interpretationText || summaryText} dark={false} />
          </div>
        )}

        {symbols.length > 0 && (
          <div className={styles.block} style={lang === "he" ? { alignItems: "flex-end", width: "100%" } : undefined}>
            <p className={styles.blockHeading}>{t.symbolsInYourDream}</p>
            <div className={styles.symbolsRow} style={lang === "he" ? { justifyContent: "flex-end", width: "100%" } : undefined}>
              {symbols.map((symbol, i) => (
                <span key={i} className={styles.symbolChip}>
                  {symbol}
                </span>
              ))}
            </div>
          </div>
        )}

        {dreamText && (
          <div className={styles.block} style={lang === "he" ? { alignItems: "flex-end", width: "100%" } : undefined}>
            <p className={styles.blockHeading}>{t.theDreamItself}</p>
            <CollapsibleText text={dreamText} dark={false} />
          </div>
        )}
      </div>

      <BottomNav active="dreams" />

      {copied && (
        <div className={styles.toast}>{t.linkCopied}</div>
      )}

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
