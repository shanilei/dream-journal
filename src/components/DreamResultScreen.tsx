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

import {
  CAPTION_MAX_WORDS,
  getCaptionWords,
  wrapCaptionLines,
  pickCaptionLayout,
  isHebrewText,
  clampFontSize,
  CAPTION_FONT_SIZE_DEFAULT,
  CAPTION_FONT_SIZE_MIN,
  CAPTION_FONT_SIZE_MAX,
  META_FONT_SIZE_DEFAULT,
  META_FONT_SIZE_MIN,
  META_FONT_SIZE_MAX,
} from "@/lib/caption";
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
  captionFontSize: savedCaptionFontSize,
  metaFontSize: savedMetaFontSize,
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
  captionFontSize?: number;
  metaFontSize?: number;
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
  // Not React state on purpose — it only gates pointer-move guards below
  // and never affects what's rendered directly (the wipe reveal is
  // painted straight onto a canvas, see drawWipeFrame below), so it was
  // causing a full re-render of this whole (fairly large) screen on every
  // touch/mouse interaction for no visual benefit.
  const isDraggingRef = useRef(false);
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

  // ── Condensation-wipe reveal ────────────────────────────────────────────
  // The clear image is painted onto a canvas, masked by a small offscreen
  // "wipe buffer" that accumulates soft, feathered brush stamps wherever
  // the finger/cursor has actually dragged — never a hard-edged circle,
  // never just wherever the pointer currently sits. Capped so even a
  // fully-wiped spot only reaches MAX_CLARITY: a faint frost always
  // remains over the artwork. Left alone, the buffer slowly fades back
  // down (condensation returning to a wiped mirror).
  const WIPE_BUFFER_W = 169;
  const WIPE_BUFFER_H = 238; // matches the card's 338:475 aspect ratio
  const MAX_CLARITY = 0.9;
  // Shrunk twice per request — was WIPE_BUFFER_W * 0.22 (~37px), now ~17px.
  const BRUSH_RADIUS = WIPE_BUFFER_W * 0.22 - 20;
  const BRUSH_ALPHA = 0.5;
  const DECAY_PER_SEC = 0.6; // fraction of remaining alpha lost per second, once the fade actually starts
  const RESET_HOLD_MS = 3000; // how long the revealed state holds untouched after the user lets go
  const FADE_DURATION_MS = 4000; // how long the fade-back itself takes once it starts

  const wipeCanvasRef = useRef<HTMLCanvasElement>(null);
  const wipeBufferRef = useRef<HTMLCanvasElement | null>(null);
  const clearImgObjRef = useRef<HTMLImageElement | null>(null);
  const lastDragPointRef = useRef<{ x: number; y: number } | null>(null);
  const wipeRafRef = useRef<number | null>(null);
  const wipeTickingRef = useRef(false);
  const lastWipeFrameTimeRef = useRef(0);
  // Single pending-reset timer — armed RESET_HOLD_MS after the user lets
  // go, cleared/re-armed on every subsequent interaction so there's never
  // more than one in flight at once.
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadingBackRef = useRef(false);
  const fadeStartAtRef = useRef(0);

  function cancelPendingReset() {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    // Also cancels an already-in-progress fade-back, not just a still-
    // pending countdown — touching again mid-fade stops it where it is.
    fadingBackRef.current = false;
  }

  function armPendingReset() {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      resetTimerRef.current = null;
      fadingBackRef.current = true;
      fadeStartAtRef.current = performance.now();
      ensureWipeTicking();
    }, RESET_HOLD_MS);
  }

  // Preloaded once outside the DOM purely as a canvas draw source — never
  // read back (no getImageData/toDataURL), so a cross-origin image here
  // never blocks rendering, only pixel readback we don't need.
  useEffect(() => {
    if (!clearImageUrl) return;
    const img = new Image();
    img.src = clearImageUrl;
    img.onload = () => {
      clearImgObjRef.current = img;
      drawWipeFrame();
    };
    return () => {
      clearImgObjRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearImageUrl]);

  function getWipeBuffer(): HTMLCanvasElement {
    if (!wipeBufferRef.current) {
      const c = document.createElement("canvas");
      c.width = WIPE_BUFFER_W;
      c.height = WIPE_BUFFER_H;
      wipeBufferRef.current = c;
    }
    return wipeBufferRef.current;
  }

  // Composites one frame: the clear image drawn at MAX_CLARITY opacity,
  // then multiplied (destination-in) by the wipe buffer's own alpha — the
  // untouched blurred .image layer underneath shows through everywhere
  // else, and even a saturated buffer spot can't exceed MAX_CLARITY.
  function drawWipeFrame() {
    const canvas = wipeCanvasRef.current;
    const clearImg = clearImgObjRef.current;
    if (!canvas || !clearImg) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (!cssW || !cssH) return;
    const pxW = Math.round(cssW * dpr);
    const pxH = Math.round(cssH * dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW;
      canvas.height = pxH;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = Math.max(pxW / clearImg.naturalWidth, pxH / clearImg.naturalHeight);
    const drawW = clearImg.naturalWidth * scale;
    const drawH = clearImg.naturalHeight * scale;
    const dx = (pxW - drawW) / 2;
    const dy = (pxH - drawH) / 2;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = MAX_CLARITY;
    ctx.drawImage(clearImg, dx, dy, drawW, drawH);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(getWipeBuffer(), 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // One soft, feathered circular stamp — a radial gradient, never a hard
  // edge — added into the wipe buffer with 'lighter' so repeated passes
  // over the same spot build up gradually instead of instantly maxing out.
  function stampWipe(px: number, py: number) {
    const buf = getWipeBuffer();
    const bctx = buf.getContext("2d");
    if (!bctx) return;
    const gradient = bctx.createRadialGradient(px, py, 0, px, py, BRUSH_RADIUS);
    gradient.addColorStop(0, `rgba(255,255,255,${BRUSH_ALPHA})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    bctx.globalCompositeOperation = "lighter";
    bctx.fillStyle = gradient;
    bctx.beginPath();
    bctx.arc(px, py, BRUSH_RADIUS, 0, Math.PI * 2);
    bctx.fill();
  }

  // Runs only while actively dragging or actively fading back — never
  // during the RESET_HOLD_MS hold itself, since nothing changes then —
  // and stops rescheduling entirely once neither applies, so there's no
  // idle per-frame cost while the revealed state is just sitting there.
  function tickWipe(now: number) {
    if (fadingBackRef.current) {
      const buf = getWipeBuffer();
      const bctx = buf.getContext("2d");
      const elapsed = now - fadeStartAtRef.current;
      if (elapsed >= FADE_DURATION_MS) {
        // Exact restoration — fully cleared, not an asymptotic trickle
        // that never quite reaches zero, so the end state matches the
        // original pre-interaction appearance precisely.
        bctx?.clearRect(0, 0, buf.width, buf.height);
        fadingBackRef.current = false;
      } else if (bctx) {
        const last = lastWipeFrameTimeRef.current || now;
        const dt = Math.min((now - last) / 1000, 0.1);
        bctx.save();
        bctx.globalCompositeOperation = "destination-out";
        bctx.fillStyle = `rgba(0,0,0,${DECAY_PER_SEC * dt})`;
        bctx.fillRect(0, 0, buf.width, buf.height);
        bctx.restore();
      }
    }
    lastWipeFrameTimeRef.current = now;

    drawWipeFrame();

    if (isDraggingRef.current || fadingBackRef.current) {
      wipeRafRef.current = requestAnimationFrame(tickWipe);
    } else {
      wipeTickingRef.current = false;
      wipeRafRef.current = null;
      lastWipeFrameTimeRef.current = 0;
    }
  }

  function ensureWipeTicking() {
    if (wipeTickingRef.current) return;
    wipeTickingRef.current = true;
    lastWipeFrameTimeRef.current = 0;
    wipeRafRef.current = requestAnimationFrame(tickWipe);
  }

  useEffect(() => {
    return () => {
      if (wipeRafRef.current) cancelAnimationFrame(wipeRafRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      wipeTickingRef.current = false;
    };
  }, []);

  // Called on every pointer/touch move while actively dragging — stamps
  // along the whole segment from the last sampled point to this one (not
  // just the endpoint), so a fast swipe doesn't leave gaps in the wiped
  // path.
  function addWipePoint(clientX: number, clientY: number) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    const px = ((clientX - rect.left) / rect.width) * WIPE_BUFFER_W;
    const py = ((clientY - rect.top) / rect.height) * WIPE_BUFFER_H;

    const last = lastDragPointRef.current;
    if (last) {
      const lastPx = ((last.x - rect.left) / rect.width) * WIPE_BUFFER_W;
      const lastPy = ((last.y - rect.top) / rect.height) * WIPE_BUFFER_H;
      const dist = Math.hypot(px - lastPx, py - lastPy);
      const steps = Math.max(1, Math.ceil(dist / (BRUSH_RADIUS * 0.5)));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        stampWipe(lastPx + (px - lastPx) * t, lastPy + (py - lastPy) * t);
      }
    } else {
      stampWipe(px, py);
    }
    lastDragPointRef.current = { x: clientX, y: clientY };
    ensureWipeTicking();
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
    captionFontSize: savedCaptionFontSize ?? CAPTION_FONT_SIZE_DEFAULT,
    metaFontSize: savedMetaFontSize ?? META_FONT_SIZE_DEFAULT,
  }));
  const [captionOverride, setCaptionOverride] = useState(lastSaved.captionOverride);
  const [showDateOn, setShowDateOn] = useState(lastSaved.showDate);
  const [showTimeOn, setShowTimeOn] = useState(lastSaved.showTime);
  const [dateInput, setDateInput] = useState(lastSaved.dateInput);
  const [timeInput, setTimeInput] = useState(lastSaved.timeInput);
  const [captionFontSize, setCaptionFontSize] = useState(lastSaved.captionFontSize);
  const [metaFontSize, setMetaFontSize] = useState(lastSaved.metaFontSize);
  const [printImageUrlState, setPrintImageUrlState] = useState(printImageUrl);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [detailsUpdated, setDetailsUpdated] = useState(false);
  // TEMPORARY DEBUG — investigating a report that tapping Save in the
  // "Edit image details" sheet never reaches the server at all (no PATCH
  // shows up in server logs, before or after). Shows each step on-screen
  // so this is visible even without Mac + cable remote debugging. Remove
  // once the missing-PATCH issue is diagnosed and fixed.
  const [debugMsg, setDebugMsg] = useState("");
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
    setCaptionFontSize(lastSaved.captionFontSize);
    setMetaFontSize(lastSaved.metaFontSize);
    setShowEditSheet(false);
  }

  async function saveEditSheet() {
    console.log("[print-debug] saveEditSheet() called, id=", id);
    setDebugMsg("1. Save tapped, handler ran");
    if (!id) {
      console.log("[print-debug] no id — bailing out before any fetch");
      setDebugMsg("1b. No id on this dream — cannot save");
      setShowEditSheet(false);
      return;
    }
    setSavingEdit(true);
    try {
      const nextDisplayAt = combineDateAndTime(dateInput, timeInput);
      const body = {
        caption: captionOverride,
        showDate: showDateOn,
        showTime: showTimeOn,
        displayAt: nextDisplayAt,
        captionFontSize,
        metaFontSize,
      };
      console.log("[print-debug] about to fetch PATCH /api/dream/" + id, body);
      setDebugMsg("2. Sending PATCH...");
      const res = await fetch(`/api/dream/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      console.log("[print-debug] fetch resolved, status=", res.status, res.ok);
      setDebugMsg(`3. Response: ${res.status}`);
      if (!res.ok) throw new Error("save failed with status " + res.status);
      const updated = await res.json().catch((e) => {
        console.log("[print-debug] res.json() failed:", e);
        return null;
      });
      console.log("[print-debug] response body:", updated);
      setDebugMsg(`4. printImageUrl in response: ${updated?.printImageUrl ? "yes" : "no"}`);
      if (updated?.printImageUrl) setPrintImageUrlState(updated.printImageUrl);
      setLastSaved({
        captionOverride,
        showDate: showDateOn,
        showTime: showTimeOn,
        dateInput,
        timeInput,
        captionFontSize,
        metaFontSize,
      });
      setShowEditSheet(false);
      setDetailsUpdated(true);
      setTimeout(() => setDetailsUpdated(false), 2500);
      setTimeout(() => setDebugMsg(""), 6000);
    } catch (err) {
      // Keep the sheet open with the user's edits intact so they can retry
      // instead of silently discarding what they typed.
      console.error("[print-debug] saveEditSheet failed:", err);
      setDebugMsg(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
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

  const [ttsStatus, setTtsStatus] = useState<"idle" | "loading" | "playing" | "unavailable" | "error">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);

  function revokeAudioUrl() {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }

  async function handleListen() {
    if (ttsStatus === "playing") {
      audioRef.current?.pause();
      setTtsStatus("idle");
      return;
    }
    if (ttsStatus === "loading") return;

    const text = interpretationText || summaryText;
    if (!text) return;

    // Cancel any in-flight request from a previous tap before starting a
    // new one — repeated taps must never race two responses against
    // each other.
    ttsAbortRef.current?.abort();
    const abortController = new AbortController();
    ttsAbortRef.current = abortController;

    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;

    // iOS Safari only allows audio.play() without a fresh user gesture if
    // an earlier play() call already happened synchronously within a
    // gesture handler on this exact <audio> element — the fetch below
    // breaks that direct gesture chain, so "unlock" the element right now
    // (the call rejects immediately since there's no source yet, which is
    // expected and safe to ignore) before doing any async work.
    audio.play().catch(() => {});
    audio.pause();

    setTtsStatus("loading");
    const voiceId = loadSelectedVoiceId();
    console.log("[tts] request start", { voiceId, textLength: text.length });
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
        signal: abortController.signal,
      });
      console.log("[tts] response", { status: res.status, contentType: res.headers.get("content-type") });
      if (res.status === 501) {
        setTtsStatus("unavailable");
        setTimeout(() => setTtsStatus("idle"), 2500);
        return;
      }
      if (!res.ok) throw new Error(`tts request failed: ${res.status}`);
      const blob = await res.blob();
      console.log("[tts] audio blob", { bytes: blob.size, type: blob.type });
      if (blob.size === 0) throw new Error("tts returned empty audio");

      revokeAudioUrl();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      audio.src = url;
      audio.onended = () => setTtsStatus("idle");
      await audio.play();
      console.log("[tts] playback started");
      setTtsStatus("playing");
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      console.error("[tts] playback error", (err as Error)?.message);
      setTtsStatus("error");
      setTimeout(() => setTtsStatus((s) => (s === "error" ? "idle" : s)), 2500);
    }
  }

  useEffect(() => {
    return () => {
      ttsAbortRef.current?.abort();
      audioRef.current?.pause();
      revokeAudioUrl();
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
            onMouseDown={(e) => {
              if (!clearImageUrl) return;
              cancelPendingReset();
              isDraggingRef.current = true;
              lastDragPointRef.current = null;
              addWipePoint(e.clientX, e.clientY);
            }}
            onMouseMove={(e) => {
              if (!isDraggingRef.current) return;
              addWipePoint(e.clientX, e.clientY);
            }}
            onMouseUp={() => {
              isDraggingRef.current = false;
              lastDragPointRef.current = null;
              armPendingReset();
            }}
            onMouseLeave={() => {
              if (!isDraggingRef.current) return;
              isDraggingRef.current = false;
              lastDragPointRef.current = null;
              armPendingReset();
            }}
            onTouchStart={(e) => {
              if (!clearImageUrl) return;
              cancelPendingReset();
              isDraggingRef.current = true;
              lastDragPointRef.current = null;
              const touch = e.touches[0];
              if (touch) addWipePoint(touch.clientX, touch.clientY);
            }}
            onTouchMove={(e) => {
              if (!isDraggingRef.current) return;
              const touch = e.touches[0];
              if (touch) addWipePoint(touch.clientX, touch.clientY);
            }}
            onTouchEnd={() => {
              isDraggingRef.current = false;
              lastDragPointRef.current = null;
              armPendingReset();
            }}
            onTouchCancel={() => {
              isDraggingRef.current = false;
              lastDragPointRef.current = null;
              armPendingReset();
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
              <canvas ref={wipeCanvasRef} className={styles.imageWipeCanvas} aria-hidden="true" />
            )}
            <div className={textColor === "white" ? styles.imageScrimDark : styles.imageScrimLight} />
            {(captionText || overlayDateLabel) && (
              <div
                className={`${styles.captionOverlay} ${
                  captionLayout === "center" ? styles.captionOverlayCenter : styles.captionOverlayBottom
                } ${isHebrew ? styles.captionOverlayRtl : ""}`}
              >
                {captionLines.length > 0 && (
                  <p
                    className={`${styles.captionText} ${isHebrew ? styles.captionTextHe : ""} ${textColor === "black" ? styles.captionTextDark : ""}`}
                    style={{ fontSize: `${captionFontSize}px` }}
                  >
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
                      <span
                        className={`${styles.captionMetaDate} ${isHebrew ? styles.captionMetaDateHe : ""} ${textColor === "black" ? styles.captionMetaDark : ""}`}
                        style={{ fontSize: `${metaFontSize}px` }}
                      >
                        {overlayDateLabel}
                      </span>
                    )}
                    {overlayTimeLabel && (
                      <span
                        className={`${styles.captionMetaTime} ${isHebrew ? styles.captionMetaTimeHe : ""} ${textColor === "black" ? styles.captionMetaDark : ""}`}
                        style={{ fontSize: `${metaFontSize}px` }}
                      >
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
                    : ttsStatus === "error"
                    ? t.audioError
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

      {/* TEMPORARY DEBUG — see saveEditSheet()'s own comment above. */}
      {debugMsg && (
        <div className={styles.toast} style={{ bottom: 90, background: "#c0392b", zIndex: 200 }}>
          DEBUG: {debugMsg}
        </div>
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
          captionFontSize={captionFontSize}
          onCaptionFontSizeChange={setCaptionFontSize}
          metaFontSize={metaFontSize}
          onMetaFontSizeChange={setMetaFontSize}
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
    {/* "print-root" is a plain (non-CSS-Modules) class — see globals.css's
        allow-list print block, which hides every other element under
        <body> by default and explicitly re-shows only this subtree. */}
    <div className={`${styles.printCard} print-root`}>
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
                    <p
                    className={`${styles.captionText} ${isHebrew ? styles.captionTextHe : ""} ${textColor === "black" ? styles.captionTextDark : ""}`}
                    style={{ fontSize: `${captionFontSize}px` }}
                  >
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
                        <span
                        className={`${styles.captionMetaDate} ${isHebrew ? styles.captionMetaDateHe : ""} ${textColor === "black" ? styles.captionMetaDark : ""}`}
                        style={{ fontSize: `${metaFontSize}px` }}
                      >
                          {overlayDateLabel}
                        </span>
                      )}
                      {overlayTimeLabel && (
                        <span
                        className={`${styles.captionMetaTime} ${isHebrew ? styles.captionMetaTimeHe : ""} ${textColor === "black" ? styles.captionMetaDark : ""}`}
                        style={{ fontSize: `${metaFontSize}px` }}
                      >
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
