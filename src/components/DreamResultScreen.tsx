"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./DreamResultScreen.module.css";
import { ArrowLeftIcon, ShareIcon, PrinterIcon } from "./Icons";
import FavoriteButton from "./FavoriteButton";
import BottomNav from "./BottomNav";
import { useLanguage } from "./LanguageProvider";
import { usePhotoBorder } from "./PhotoBorderProvider";
import { translateMood, formatDreamDate, formatDreamTime } from "@/i18n/translations";

import { CAPTION_MAX_WORDS, getCaptionWords, pickCaptionLayout, isHebrewText } from "@/lib/caption";
import { loadFavorites, saveFavorites } from "@/lib/favorites";

// This screen is rendered in two places that must look identical and
// never re-animate against each other: (1) as the real /dream/[id]
// route, and (2) as the Gallery's in-place overlay (see
// DreamAnalysisOverlay in HomeScreenClient.tsx), where the image shares
// a layoutId with the tapped grid thumbnail so Framer moves/resizes it
// directly from card to final position — one motion, not "expand to a
// preview, then jump again on the real page". The image itself gets NO
// separate scale/opacity/blur settle of its own; the layoutId FLIP is
// the only thing that ever moves or resizes it. `skipEntrance` is set
// when the real route mounts right after that overlay handoff, so this
// second mount renders already-settled instead of replaying the text
// stagger a second time — a fresh direct visit (no preceding overlay)
// leaves it false and gets the normal fade-up.
const EASE = [0.22, 1, 0.36, 1] as const;
const STAGGER_STEP = 0.03; // 40–60ms between elements, tuned to fit the ~550–650ms total
const CONTENT_BASE_DELAY = 0.2; // analysis content starts ~200ms in, per spec

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
  skipEntrance = false,
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
  // True only when this mount immediately follows the Gallery overlay's
  // own already-played entrance — see the file-level comment above.
  skipEntrance?: boolean;
}) {
  const { lang, t } = useLanguage();
  const { showBorder } = usePhotoBorder();
  const [favorited, setFavorited] = useState(false);
  const reduceMotionPreference = useReducedMotion();
  const reduceMotion = reduceMotionPreference || skipEntrance;

  // step 0 = title, 1 = date, 2 = mood tag, 3+ = symbol tags, then
  // interpretation gets a fixed slot past however many tags exist (up to
  // 3 symbols, so index 6 is always safely after all of them).
  function fadeStep(step: number) {
    if (reduceMotion) return { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } };
    return {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.25, ease: EASE, delay: CONTENT_BASE_DELAY + step * STAGGER_STEP },
    };
  }

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [textColor, setTextColor] = useState<"white" | "black">("white");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [navHidden, setNavHidden] = useState(false);

  // Hide the bottom nav while scrolling down (more room to read), bring it
  // back the moment the user scrolls back up — same slide-down/fade
  // `hidden` prop BottomNav already uses during recording.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let lastY = el.scrollTop;
    function onScroll() {
      if (!el) return;
      const y = el.scrollTop;
      const delta = y - lastY;
      if (Math.abs(delta) > 4) {
        setNavHidden(delta > 0 && y > 80);
        lastY = y;
      }
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

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
    <div className={styles.screen} ref={scrollRef}>
      <motion.div
        className={styles.topBar}
        initial={reduceMotion ? false : { opacity: 0, y: -7 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE }}
      >
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
      </motion.div>

      <div className={styles.content}>
        {/* No opacity/scale/blur settle of its own — the shared layoutId
            below (see .image) is the only thing that ever moves or
            resizes the image, so there's exactly one motion, not this
            card animating in and then the image separately animating
            inside it. */}
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
            <motion.img
              layoutId={id ? `dream-photo-${id}` : undefined}
              ref={imgRef}
              className={styles.image}
              src={imageUrl}
              alt="Dream artwork"
              onLoad={sampleBrightness}
              transition={{ type: "tween", duration: 0.45, ease: EASE }}
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
          <motion.div className={styles.titleRow} {...fadeStep(0)}>
            <p className={styles.title}>{dreamTitle}</p>
            <FavoriteButton
              filled={favorited}
              onToggle={toggleFavorite}
              size={22}
              color="#ffffff"
              className={styles.titleHeartBtn}
            />
          </motion.div>
          <div className={styles.metaRow} style={lang === "he" ? { justifyContent: "flex-start", width: "100%" } : undefined}>
            {/* Mood tag animates with the symbol tags (step 2) rather than
                with the date next to it (step 1) — per the spec, emotion +
                symbol tags fade in together as one "tags" beat, title →
                date → tags → interpretation, regardless of where each
                sits in the layout. */}
            <motion.span className={styles.moodPill} {...fadeStep(2)}>{translateMood(mood, lang)}</motion.span>
            <motion.span className={styles.metaText} {...fadeStep(1)}>{dateLabel}</motion.span>
            {timeLabel && <motion.span className={styles.metaText} {...fadeStep(1)}>{timeLabel}</motion.span>}
          </div>
        </div>

        {(interpretationText || summaryText) && (
          <motion.div
            className={styles.block}
            style={lang === "he" ? { alignItems: "flex-end", width: "100%" } : undefined}
            {...fadeStep(6)}
          >
            <p className={styles.blockHeading}>{t.whatDoesItSay}</p>
            <CollapsibleText text={interpretationText || summaryText} dark={false} />
          </motion.div>
        )}

        {symbols.length > 0 && (
          <div className={styles.block} style={lang === "he" ? { alignItems: "flex-start", width: "100%" } : undefined}>
            <p className={styles.blockHeading}>{t.symbolsInYourDream}</p>
            <div className={styles.symbolsRow} style={lang === "he" ? { justifyContent: "flex-start", width: "100%" } : undefined}>
              {symbols.map((symbol, i) => (
                <motion.span key={i} className={styles.symbolChip} {...fadeStep(3 + i)}>
                  {symbol}
                </motion.span>
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

      {/* Opacity only, no y — BottomNav is position:fixed, and a
          transform-animated ancestor (a translateY-based fade-up) would
          make it fixed-relative-to-this-wrapper instead of the viewport. */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.28, ease: EASE }}
      >
        <BottomNav active="dreams" hidden={navHidden} />
      </motion.div>

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
            <img className={styles.printFlatImage} src={printImageUrl} alt="Dream artwork" />
          ) : (
            <div className={styles.imageWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.image} src={imageUrl} alt="Dream artwork" />
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
