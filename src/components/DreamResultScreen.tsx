"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DreamResultScreen.module.css";
import { ArrowLeftIcon, ShareIcon, PrinterIcon, HeartIcon } from "./Icons";
import BottomNav from "./BottomNav";
import { useLanguage } from "./LanguageProvider";
import { usePhotoBorder } from "./PhotoBorderProvider";
import { translateMood, formatDreamDate, formatDreamTime } from "@/i18n/translations";

import { CAPTION_MAX_WORDS, getCaptionWords, pickCaptionLayout, isHebrewText } from "@/lib/caption";

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
  printImageUrl,
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
  printImageUrl?: string;
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

  const REVEAL_RADIUS = 45; // 90px spotlight
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
  const isHebrew = isHebrewText(dreamText || summaryText || "");
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
    // A hidden .printCard copy of the image card lives in this same
    // document and is shown only via @media print (see module.css) — this
    // avoids popup windows entirely, since window.open()/document.write()
    // proved unreliable across Safari (image rendered solid black in the
    // print rasterizer) and Chrome (print dialog never appeared, likely
    // because printing was deferred out of the click's user-gesture window).
    window.print();
  }

  return (
    <>
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

        <div className={styles.titleBlock} style={lang === "he" ? { alignItems: "flex-start", width: "100%" } : undefined}>
          <div className={styles.titleRow}>
            <p className={styles.title}>{dreamTitle}</p>
            <button type="button" className={styles.titleHeartBtn} aria-label="Favourite" onClick={toggleFavorite}>
              <HeartIcon size={22} color="#ffffff" filled={favorited} />
            </button>
          </div>
          <div className={styles.metaRow} style={lang === "he" ? { justifyContent: "flex-start", width: "100%" } : undefined}>
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
          <div className={styles.block} style={lang === "he" ? { alignItems: "flex-start", width: "100%" } : undefined}>
            <p className={styles.blockHeading}>{t.symbolsInYourDream}</p>
            <div className={styles.symbolsRow} style={lang === "he" ? { justifyContent: "flex-start", width: "100%" } : undefined}>
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

    {/* Print-only copy of the image card — shown via @media print in
        DreamResultScreen.module.css. When printImageUrl is available it's a
        single flattened, fully-opaque PNG (image+scrim+caption baked in
        server-side at creation time — see src/print-image.ts) so printing
        is just "show one plain <img>". Safari's print/PDF rasterizer proved
        unreliable compositing any layered/semi-transparent DOM content
        (popups, gradients, transparent image regions all rendered as
        solid black), so nothing print-specific is composited live anymore.
        Dreams created before this existed fall back to the old layered
        markup, which at least renders (if imperfectly) on other browsers. */}
    <div className={styles.printCard}>
      <div className={styles.printCardInner}>
        <div className={`${styles.imageCard} ${showBorder ? "" : styles.imageCardNoBorder}`}>
          {printImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.printFlatImage} src={printImageUrl} alt="Generated dream artwork" />
          ) : (
            <div className={styles.imageWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.image} src={imageUrl} alt="Generated dream artwork" />
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
          )}
        </div>
      </div>
    </div>
    </>
  );
}
