"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import styles from "./DreamResultScreen.module.css";
import { ArrowLeftIcon, MoreIcon, PrinterIcon, PlayIcon, VolumeIcon, PencilIcon, ShareIcon, SaveIcon } from "./Icons";
import FavoriteButton from "./FavoriteButton";
import BottomNav from "./BottomNav";
import EditImageDetailsSheet from "./EditImageDetailsSheet";
import { useLanguage } from "./LanguageProvider";
import { usePhotoBorder } from "./PhotoBorderProvider";
import { translateMood, formatDreamDate, formatDreamTime } from "@/i18n/translations";

import { CAPTION_MAX_WORDS, getCaptionWords, wrapCaptionLines, pickCaptionLayout, isHebrewText } from "@/lib/caption";
import { toDateInputValue, toTimeInputValue, combineDateAndTime } from "@/lib/dream-format";
import { loadFavorites, saveFavorites } from "@/lib/favorites";
import { loadSelectedVoiceId } from "@/lib/voicePreference";
import { preventWidows } from "@/lib/text";

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
        {preventWidows(text.replace(/\n+/g, " "))}
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
  captionOverride: savedCaptionOverride,
  showDate: savedShowDate,
  showTime: savedShowTime,
  displayAt: savedDisplayAt,
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
  // Overlay-only edits (see "Edit image details") — never touches the
  // generated artwork, only the caption/date/time drawn on top of it.
  captionOverride?: string;
  showDate?: boolean;
  showTime?: boolean;
  displayAt?: string;
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
  // Mist/condensation overlay for the image's entrance — mounted only
  // while the reveal is playing, removed from the DOM the moment it
  // finishes fading (see the .imageMist element below) so nothing keeps
  // rendering after the one-time reveal completes. Never mounted at all
  // when motion is skipped (reduced-motion preference, or this is the
  // second mount right after the Gallery handoff).
  const [mistVisible, setMistVisible] = useState(!reduceMotion);

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
  // Not React state on purpose — it only gates a couple of pointer-move
  // guards below and never affects what's rendered, so it was causing a
  // full re-render of this whole (fairly large) screen on every touch/
  // mouse enter and leave for no visual benefit. A ref gives identical
  // behavior with zero re-renders.
  const revealedRef = useRef(false);
  // Starts hidden — keeps focus on the artwork/interpretation the moment
  // this screen opens, before the user has scrolled at all. Reveals with
  // BottomNav's existing slide-up/fade `hidden` prop (same mechanism
  // already used during recording) once the user scrolls past a small
  // threshold, then stays visible while they keep reading regardless of
  // scroll direction — only hides again if they scroll back to the very
  // top. The gap between the two thresholds avoids flicker if the
  // scroll position happens to sit right at either edge.
  const [navHidden, setNavHidden] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const SHOW_THRESHOLD = 24;
    const HIDE_AT_TOP = 2;
    function onScroll() {
      if (!el) return;
      const y = el.scrollTop;
      setNavHidden((prev) => {
        if (prev && y >= SHOW_THRESHOLD) return false;
        if (!prev && y <= HIDE_AT_TOP) return true;
        return prev;
      });
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const REVEAL_RADIUS = 65; // 130px spotlight (mouse)
  // Touch needs to be obviously bigger than mouse: a mouse pointer is
  // already precisely where the user is looking, but a finger covers the
  // touch point itself and the page can shift slightly the moment a
  // touch starts — a same-size reveal is easy to miss entirely. ~60%
  // bigger, within the 50–70% range.
  const TOUCH_REVEAL_RADIUS = REVEAL_RADIUS * 1.6; // ~208px spotlight (touch)
  // On touch release, the circle should linger a beat before it starts
  // closing — a same-instant fade reads as flickery on a finger release,
  // where the user is still looking at the spot they just touched.
  const TOUCH_RELEASE_HOLD_MS = 1100;
  const targetMaskRef = useRef({ x: 0, y: 0, r: 0 });
  const displayMaskRef = useRef({ x: 0, y: 0, r: 0 });
  // Trails behind the main circle with slower easing and a larger target
  // radius, so it visually "lags" and gets dragged along — the pull effect.
  const trailMaskRef = useRef({ x: 0, y: 0, r: 0 });
  const maskRafRef = useRef<number | null>(null);
  // Set true only while the touch-release fade is playing, so that close
  // alone eases slower than every other radius change (grow-in, mouse
  // leave) without touching those.
  const slowFadeRef = useRef(false);
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Whether the rAF loop below is currently scheduled — lets every
  // interaction handler safely call ensureTicking() without ever
  // double-scheduling a second parallel chain of frames.
  const tickingRef = useRef(false);

  // Was previously an unconditional `requestAnimationFrame(tick)` at the
  // end of tick() itself, forever — i.e. this ran every single frame for
  // the entire lifetime of the screen, whether or not the reveal was
  // actually moving, because the exponential-ease formulas below never
  // reach their target *exactly*, only asymptotically closer. Every one
  // of those frames wrote 6 CSS custom properties consumed inside
  // mask-image's radial-gradient()s (see .imageClear/.imageClearTrail/
  // .imageScrimDark/.imageScrimLight in the stylesheet) — recomputing a
  // multi-layer CSS mask is one of the more expensive things a browser
  // can be asked to repaint, and Safari in particular struggled to keep
  // that at 60fps indefinitely, which is what made the *interactive*
  // part of a touch feel like it was dropping frames even after the
  // finger had stopped moving.
  //
  // Now: once every value is within a visually-imperceptible epsilon of
  // its target, tick() snaps to the exact target, writes it one final
  // time, and simply stops rescheduling itself — no more idle cost.
  // Every place that changes a target value below calls ensureTicking()
  // to resume the loop; it's a no-op if already running.
  const MASK_EPSILON = 0.05; // px — below this, the difference isn't visible

  function tick() {
    const target = targetMaskRef.current;
    const display = displayMaskRef.current;
    display.x += (target.x - display.x) * 0.22;
    display.y += (target.y - display.y) * 0.22;
    display.r += (target.r - display.r) * (slowFadeRef.current ? 0.018 : 0.15);

    const trail = trailMaskRef.current;
    trail.x += (target.x - trail.x) * 0.07;
    trail.y += (target.y - trail.y) * 0.07;
    trail.r += (target.r * 1.4 - trail.r) * 0.06;

    const settled =
      Math.abs(target.x - display.x) < MASK_EPSILON &&
      Math.abs(target.y - display.y) < MASK_EPSILON &&
      Math.abs(target.r - display.r) < MASK_EPSILON &&
      Math.abs(target.x - trail.x) < MASK_EPSILON &&
      Math.abs(target.y - trail.y) < MASK_EPSILON &&
      Math.abs(target.r * 1.4 - trail.r) < MASK_EPSILON;

    if (settled) {
      display.x = target.x;
      display.y = target.y;
      display.r = target.r;
      trail.x = target.x;
      trail.y = target.y;
      trail.r = target.r * 1.4;
    }

    const el = wrapRef.current;
    if (el) {
      el.style.setProperty("--mask-x", `${display.x}px`);
      el.style.setProperty("--mask-y", `${display.y}px`);
      el.style.setProperty("--mask-r", `${display.r}px`);
      el.style.setProperty("--trail-x", `${trail.x}px`);
      el.style.setProperty("--trail-y", `${trail.y}px`);
      el.style.setProperty("--trail-r", `${trail.r}px`);
    }

    if (settled) {
      tickingRef.current = false;
      maskRafRef.current = null;
      return;
    }
    maskRafRef.current = requestAnimationFrame(tick);
  }

  function ensureTicking() {
    if (tickingRef.current) return;
    tickingRef.current = true;
    maskRafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    // Paints the initial at-rest state once, then stops immediately (both
    // target and display start at r:0, so the very first tick() is
    // already "settled").
    ensureTicking();
    return () => {
      if (maskRafRef.current) cancelAnimationFrame(maskRafRef.current);
      if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
      tickingRef.current = false;
    };
  }, []);

  function updateMaskPos(clientX: number, clientY: number) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    targetMaskRef.current.x = clientX - rect.left;
    targetMaskRef.current.y = clientY - rect.top;
    ensureTicking();
  }
  const [copied, setCopied] = useState(false);

  // ── "Edit image details" (caption/date/time overlay editing) ───────────
  // These are the values actually drawn on the image — they double as the
  // sheet's live-bound fields, so typing/toggling updates the overlay
  // immediately with no separate "preview" step. `lastSaved` is the
  // snapshot Cancel reverts to; Save both persists to the server and
  // becomes the new snapshot.
  const autoCaptionPlain = getCaptionWords(summaryText, CAPTION_MAX_WORDS).replace(/\n/g, " ");
  const [lastSaved, setLastSaved] = useState(() => ({
    captionOverride: savedCaptionOverride ?? autoCaptionPlain,
    showDate: savedShowDate ?? true,
    showTime: savedShowTime ?? true,
    dateInput: toDateInputValue(savedDisplayAt ?? createdAt),
    timeInput: toTimeInputValue(savedDisplayAt ?? createdAt),
  }));
  const [captionOverride, setCaptionOverride] = useState(lastSaved.captionOverride);
  const [showDateOn, setShowDateOn] = useState(lastSaved.showDate);
  const [showTimeOn, setShowTimeOn] = useState(lastSaved.showTime);
  const [dateInput, setDateInput] = useState(lastSaved.dateInput);
  const [timeInput, setTimeInput] = useState(lastSaved.timeInput);
  const [printImageUrlState, setPrintImageUrlState] = useState(printImageUrl);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [detailsUpdated, setDetailsUpdated] = useState(false);
  const displayAt = combineDateAndTime(dateInput, timeInput);

  function openEditSheet() {
    setShowMoreMenu(false);
    setShowEditSheet(true);
  }

  function cancelEditSheet() {
    setCaptionOverride(lastSaved.captionOverride);
    setShowDateOn(lastSaved.showDate);
    setShowTimeOn(lastSaved.showTime);
    setDateInput(lastSaved.dateInput);
    setTimeInput(lastSaved.timeInput);
    setShowEditSheet(false);
  }

  async function saveEditSheet() {
    if (!id) {
      setShowEditSheet(false);
      return;
    }
    setSavingEdit(true);
    try {
      const nextDisplayAt = combineDateAndTime(dateInput, timeInput);
      const res = await fetch(`/api/dream/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: captionOverride,
          showDate: showDateOn,
          showTime: showTimeOn,
          displayAt: nextDisplayAt,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      const updated = await res.json().catch(() => null);
      if (updated?.printImageUrl) setPrintImageUrlState(updated.printImageUrl);
      setLastSaved({
        captionOverride,
        showDate: showDateOn,
        showTime: showTimeOn,
        dateInput,
        timeInput,
      });
      setShowEditSheet(false);
      setDetailsUpdated(true);
      setTimeout(() => setDetailsUpdated(false), 2500);
    } catch {
      // Keep the sheet open with the user's edits intact so they can retry
      // instead of silently discarding what they typed.
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleSaveImage() {
    setShowMoreMenu(false);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `dream-${id ?? "image"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Non-fatal — nothing else to fall back to here.
    }
  }

  const isHebrew = isHebrewText(captionOverride || dreamText || summaryText || "");
  const captionText = captionOverride.trim() ? wrapCaptionLines(captionOverride) : getCaptionWords(summaryText, CAPTION_MAX_WORDS);
  const captionLines = captionText ? captionText.split("\n") : [];
  const captionLayout = pickCaptionLayout(imageUrl);
  const dateLang = isHebrew ? "he" : lang;
  // Always computed regardless of the show/hide toggles — used by the
  // title fallback and the meta-row badges below the image, which are a
  // separate piece of UI from the image's own caption overlay.
  const dateLabel = formatDreamDate(displayAt, dateLang);
  const timeLabel = formatDreamTime(displayAt, dateLang);
  // What's actually drawn on the image — hidden independently per toggle.
  const overlayDateLabel = showDateOn ? dateLabel : "";
  const overlayTimeLabel = showTimeOn ? timeLabel : "";
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

  const [ttsStatus, setTtsStatus] = useState<"idle" | "loading" | "playing" | "unavailable">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handleListen() {
    if (ttsStatus === "playing") {
      audioRef.current?.pause();
      setTtsStatus("idle");
      return;
    }
    if (ttsStatus === "loading") return;

    const text = interpretationText || summaryText;
    if (!text) return;

    setTtsStatus("loading");
    try {
      const voiceId = loadSelectedVoiceId();
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      });
      if (res.status === 501) {
        setTtsStatus("unavailable");
        setTimeout(() => setTtsStatus("idle"), 2500);
        return;
      }
      if (!res.ok) throw new Error("tts request failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (!audioRef.current) audioRef.current = new Audio();
      const audio = audioRef.current;
      audio.src = url;
      audio.onended = () => setTtsStatus("idle");
      await audio.play();
      setTtsStatus("playing");
    } catch {
      setTtsStatus("idle");
    }
  }

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

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
          <div className={styles.moreMenuWrapper}>
            <button
              type="button"
              className={styles.iconButton}
              aria-label={t.more}
              aria-expanded={showMoreMenu}
              onClick={() => setShowMoreMenu((v) => !v)}
            >
              <MoreIcon size={18} color="currentColor" />
            </button>
            <AnimatePresence>
              {showMoreMenu && (
                <>
                  <div className={styles.moreMenuBackdrop} onClick={() => setShowMoreMenu(false)} />
                  <motion.div
                    className={styles.moreMenu}
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: EASE }}
                  >
                    <button type="button" className={styles.moreMenuItem} onClick={openEditSheet}>
                      <PencilIcon size={16} color="#fff" />
                      <span>{t.editImageDetails}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.moreMenuItem}
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleShare();
                      }}
                    >
                      <ShareIcon size={16} color="#fff" />
                      <span>{t.shareImage}</span>
                    </button>
                    <button type="button" className={styles.moreMenuItem} onClick={handleSaveImage}>
                      <SaveIcon size={16} color="#fff" />
                      <span>{t.saveImage}</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
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
              ensureTicking();
              revealedRef.current = true;
            }}
            onMouseMove={(e) => revealedRef.current && updateMaskPos(e.clientX, e.clientY)}
            onMouseLeave={() => {
              targetMaskRef.current.r = 0;
              ensureTicking();
              revealedRef.current = false;
            }}
            onTouchStart={(e) => {
              if (!clearImageUrl) return;
              if (releaseTimerRef.current) {
                clearTimeout(releaseTimerRef.current);
                releaseTimerRef.current = null;
              }
              slowFadeRef.current = false;
              const touch = e.touches[0];
              if (touch) updateMaskPos(touch.clientX, touch.clientY);
              targetMaskRef.current.r = TOUCH_REVEAL_RADIUS;
              // Snap straight to the target on first touch instead of
              // easing in from wherever the last interaction left off —
              // otherwise the initial reveal can still read as small/
              // subtle for the first several frames, exactly the "easy
              // to miss" problem this is meant to fix. Position/radius
              // only for this one starting frame; the rAF loop's normal
              // easing takes back over immediately after (touchmove,
              // and the trail layer, are both untouched).
              displayMaskRef.current.x = targetMaskRef.current.x;
              displayMaskRef.current.y = targetMaskRef.current.y;
              displayMaskRef.current.r = TOUCH_REVEAL_RADIUS;
              ensureTicking();
              revealedRef.current = true;
            }}
            onTouchMove={(e) => {
              if (!revealedRef.current) return;
              const touch = e.touches[0];
              if (touch) updateMaskPos(touch.clientX, touch.clientY);
            }}
            onTouchEnd={() => {
              revealedRef.current = false;
              if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
              releaseTimerRef.current = setTimeout(() => {
                slowFadeRef.current = true;
                targetMaskRef.current.r = 0;
                ensureTicking();
              }, TOUCH_RELEASE_HOLD_MS);
            }}
            onTouchCancel={() => {
              revealedRef.current = false;
              if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
              releaseTimerRef.current = setTimeout(() => {
                slowFadeRef.current = true;
                targetMaskRef.current.r = 0;
                ensureTicking();
              }, TOUCH_RELEASE_HOLD_MS);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* Mist/glass-condensation reveal: the shared layoutId FLIP
                (position/size, from the Gallery thumbnail) keeps its own
                0.45s tween untouched — filter/opacity animate separately,
                slower, so the artwork settles into place quickly and then
                keeps clearing up like fog lifting off glass. Skipped
                entirely (initial={false}) under reduced motion or on the
                second mount right after the Gallery handoff, same as
                every other entrance animation on this screen. */}
            <motion.img
              layoutId={id ? `dream-photo-${id}` : undefined}
              ref={imgRef}
              className={styles.image}
              src={imageUrl}
              alt="Dream artwork"
              onLoad={sampleBrightness}
              initial={reduceMotion ? false : { filter: "blur(30px) saturate(0.9)", opacity: 0.8 }}
              animate={{ filter: "blur(0px) saturate(1)", opacity: 1 }}
              transition={{
                layout: { type: "tween", duration: 0.45, ease: EASE },
                filter: { duration: 2, ease: EASE },
                opacity: { duration: 2, ease: EASE },
              }}
            />
            {mistVisible && (
              <motion.div
                className={styles.imageMist}
                aria-hidden="true"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 2, ease: EASE }}
                onAnimationComplete={() => setMistVisible(false)}
              />
            )}
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
            {(captionText || overlayDateLabel) && (
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
                {(overlayDateLabel || overlayTimeLabel) && (
                  <div className={styles.captionMeta}>
                    {overlayDateLabel && (
                      <span className={`${styles.captionMetaDate} ${isHebrew ? styles.captionMetaDateHe : ""} ${textColor === "black" ? styles.captionMetaDark : ""}`}>
                        {overlayDateLabel}
                      </span>
                    )}
                    {overlayTimeLabel && (
                      <span className={`${styles.captionMetaTime} ${isHebrew ? styles.captionMetaTimeHe : ""} ${textColor === "black" ? styles.captionMetaDark : ""}`}>
                        {overlayTimeLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.titleBlock} style={lang === "he" ? { alignItems: "flex-start", width: "100%" } : undefined}>
          <motion.div className={styles.titleRow} {...fadeStep(0)}>
            <p className={styles.title}>{preventWidows(dreamTitle)}</p>
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
            <div className={styles.blockHeadingRow}>
              <p className={styles.blockHeading}>{t.whatDoesItSay}</p>
              {/* TTS doesn't work correctly in Hebrew yet — hidden there
                  (not just disabled) so nothing implies it's available;
                  English narration itself is untouched. */}
              {lang !== "he" && (
                <button
                  type="button"
                  className={styles.listenBtn}
                  onClick={handleListen}
                  aria-label={ttsStatus === "playing" ? t.reading : t.listen}
                >
                  <span className={styles.listenBtnIcon}>
                    {ttsStatus === "playing" ? (
                      <VolumeIcon size={14} color="currentColor" />
                    ) : (
                      <PlayIcon size={14} color="currentColor" />
                    )}
                  </span>
                  {ttsStatus === "playing"
                    ? t.reading
                    : ttsStatus === "loading"
                    ? t.loadingAudio
                    : t.listen}
                </button>
              )}
            </div>
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

      {detailsUpdated && (
        <div className={styles.toast}>{t.detailsUpdated}</div>
      )}

      {showEditSheet && (
        <EditImageDetailsSheet
          caption={captionOverride}
          onCaptionChange={setCaptionOverride}
          dateValue={dateInput}
          onDateChange={setDateInput}
          timeValue={timeInput}
          onTimeChange={setTimeInput}
          showDate={showDateOn}
          onShowDateChange={setShowDateOn}
          showTime={showTimeOn}
          onShowTimeChange={setShowTimeOn}
          saving={savingEdit}
          onSave={saveEditSheet}
          onCancel={cancelEditSheet}
        />
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
          {printImageUrlState ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.printFlatImage} src={printImageUrlState} alt="Dream artwork" />
          ) : (
            <div className={styles.imageWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.image} src={imageUrl} alt="Dream artwork" />
              <div className={textColor === "white" ? styles.imageScrimDark : styles.imageScrimLight} />
              {(captionText || overlayDateLabel) && (
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
                  {(overlayDateLabel || overlayTimeLabel) && (
                    <div className={styles.captionMeta}>
                      {overlayDateLabel && (
                        <span className={`${styles.captionMetaDate} ${isHebrew ? styles.captionMetaDateHe : ""} ${textColor === "black" ? styles.captionMetaDark : ""}`}>
                          {overlayDateLabel}
                        </span>
                      )}
                      {overlayTimeLabel && (
                        <span className={`${styles.captionMetaTime} ${isHebrew ? styles.captionMetaTimeHe : ""} ${textColor === "black" ? styles.captionMetaDark : ""}`}>
                          {overlayTimeLabel}
                        </span>
                      )}
                    </div>
                  )}
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
