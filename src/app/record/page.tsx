"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./record.module.css";
import { useSetBottomNavHidden } from "@/components/BottomNavVisibility";
import VoiceRecordCircle from "@/components/VoiceRecordCircle";
import { useLanguage } from "@/components/LanguageProvider";
import { CloseIcon, PauseIcon, PlayIcon, RepeatIcon } from "@/components/Icons";
import { useIsTablet } from "@/lib/useIsTablet";
import { useIsExhibition } from "@/components/ExhibitionMode";
import { useIdleAnimationPause } from "@/lib/useIdleAnimationPause";

// Not needed for the idle/recording UI (the vast majority of a visit to
// this route) — only mounted once transcription/analysis is already
// underway, by which point there's real network wait time to absorb the
// small extra chunk fetch. `loading: () => null` matches this route's
// existing dark background (see .screen in record.module.css / body in
// globals.css) instead of a stock spinner, so any brief gap between
// status flipping and the chunk resolving reads as "still on the same
// dark screen," not a flash.
const DreamLoadingScreen = dynamic(() => import("@/components/DreamLoadingScreen"), {
  loading: () => null,
});
const DreamResultScreen = dynamic(() => import("@/components/DreamResultScreen"), {
  loading: () => null,
});

type DreamResult = {
  id: string;
  name?: string;
  imageUrl: string;
  clearImageUrl?: string;
  printImageUrl?: string;
  createdAt: string;
  mood: string;
  summaryText: string;
  interpretationText?: string;
  symbols: string[];
  dreamText: string;
};

type Status = "idle" | "recording" | "loading" | "result" | "error";

function summarize(themes: string[]): string {
  return themes.length ? `${themes.slice(0, 2).join(". ")}.` : "";
}

function shortSymbol(symbol: string): string {
  return symbol.split(" - ")[0].trim();
}

const AUDIO_BAR_COUNT = 5;
const EASE = [0.22, 1, 0.36, 1] as const;
// Both exhibition and normal mobile — how long into a recording before
// the helper text swaps to a "tap again" hint (see the .prompt render
// below).
const RECORD_SEND_HINT_DELAY_SEC = 3;

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function RecordPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  // CSS media query drives the actual tablet layout (see the "TABLET /
  // IPAD" block in record.module.css) — this is just a prepared `data-`
  // hook for any future logic that genuinely needs JS, not CSS, to branch
  // (kept for other screens to reuse as they get their own tablet pass).
  const isTablet = useIsTablet();
  const isExhibition = useIsExhibition();
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<DreamResult | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [restartToken, setRestartToken] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(() => Array(AUDIO_BAR_COUNT).fill(0));
  // Set right before tearing down the recorder for a reason other than
  // "the user is done, submit it" (cancel or restart) — the teardown
  // still fires VoiceRecordCircle's onRecordingComplete with whatever was
  // captured so far, so this tells the handler below to throw that away
  // instead of sending it off for transcription.
  const pendingActionRef = useRef<"submit" | "discard">("submit");

  const isRecording = status === "recording";
  // The global, persistent BottomNav (see GlobalBottomNav.tsx) reads this
  // instead of this screen rendering its own instance. Also forced hidden
  // through "loading" and "result" — DreamLoadingScreen never manages
  // this itself, and once DreamResultScreen mounts it takes over hidden
  // management (scroll-driven on mobile, always-visible in exhibition).
  // Keeping this true (unchanged) across the loading->result transition,
  // rather than briefly computing false, avoids a race where this
  // effect (parent) could re-fire and stomp on DreamResultScreen's own
  // mount effect (child) — child effects run first, so if the parent's
  // value actually changed it would run after and override it back.
  useSetBottomNavHidden(isRecording || status === "loading" || status === "result");

  const showSendHint = isRecording && elapsedSec >= RECORD_SEND_HINT_DELAY_SEC;

  // The idle screen's background (gradient pulse, starfield twinkle, glow
  // blobs, the orb's rotating rings) is decorative — pause it once the
  // user's settled in or after a few idle seconds, same as every other
  // screen. Recording itself always overrides it: the orb visually
  // representing "I'm listening" shouldn't go idle-still mid-recording,
  // so it's excluded from the paused state below regardless of what the
  // hook's own idle timer is doing internally.
  // This is the orb the user sees first when opening the app, so it gets a
  // much longer idle window than other screens' background decoration
  // (65s, not the 4s default) — it should keep breathing/rotating smoothly
  // for at least a minute before settling still, not go static almost
  // immediately. Still pauses eventually (same battery-conscious mechanism,
  // just a later trigger), and pause/resume itself was already seamless
  // (animation-play-state, never restarts from 0%).
  const { paused: idleAnimPaused, rootRef: screenRef, resume: resumeIdleAnim } = useIdleAnimationPause({ idleMs: 65000 });
  const bgAnimPaused = idleAnimPaused && !isRecording;

  // .prompt/.recordButtonWrap are both position:absolute with fixed
  // offsets tuned assuming the prompt text always renders as exactly 2
  // lines — but the Hebrew prompt has been observed (on a real device,
  // not reproducible locally across several browser engines/configs)
  // wrapping onto more lines instead, pushing its bottom edge down into
  // the orb below it. Confirmed to affect both the phone layout (small
  // px/percent offsets) and Exhibition Mode's own separate absolute-px
  // offsets (540px-wide box at a much bigger 90px font — if anything
  // more prone to overflow-wrapping, not less). Rather than keep
  // guessing at bigger static offsets in either place, this measures
  // the prompt's actual rendered height and positions the orb directly
  // beneath it (plus a gap) — correct regardless of how many lines the
  // text wraps to, in any environment. Tablet keeps its own already-
  // tuned flex-based layout untouched (never absolute-positioned in the
  // first place, so it isn't exposed to this bug the same way).
  const promptRef = useRef<HTMLParagraphElement>(null);
  const recordButtonWrapRef = useRef<HTMLDivElement>(null);
  const [measuredOrbTop, setMeasuredOrbTop] = useState<number | null>(null);
  const [measuredTypeFallbackTop, setMeasuredTypeFallbackTop] = useState<number | null>(null);
  const ORB_GAP_PX = isExhibition ? 100 : 40;
  const TYPE_FALLBACK_GAP_PX = isExhibition ? 40 : 16;

  useLayoutEffect(() => {
    if (isTablet) return;
    function measure() {
      // This whole calculation is a display-polish nice-to-have — if any
      // DOM API used here ever behaves unexpectedly in some browser/
      // in-app-webview, it must never take the whole page down with it
      // (that's exactly what letting it throw did, once, in production).
      // Worst case on a caught error: the orb/type-fallback simply keep
      // whatever position the plain CSS fallback already gives them.
      try {
        const promptEl = promptRef.current;
        const screenEl = screenRef.current;
        if (!promptEl || !screenEl) return;
        const promptBottom = promptEl.offsetTop + promptEl.offsetHeight;
        const orbTop = promptBottom + ORB_GAP_PX;
        setMeasuredOrbTop(orbTop);

        // The orb's own height is fixed by CSS (doesn't reflow with text),
        // but re-measure it directly rather than hardcode it a second time
        // here — .recordButtonWrap only gets its top overridden above, so
        // its rendered height still comes straight from the stylesheet.
        const orbEl = recordButtonWrapRef.current;
        if (orbEl) {
          setMeasuredTypeFallbackTop(orbTop + orbEl.offsetHeight + TYPE_FALLBACK_GAP_PX);
        }
      } catch (err) {
        console.error("record prompt/orb measurement failed:", err);
      }
    }
    measure();
    // Hebrew's Ploni font can finish loading (and reflow the text it's
    // already painted in a fallback font) after this first measurement —
    // re-measuring once it's ready catches that shift instead of leaving
    // a stale, now-wrong position from the fallback font's layout.
    document.fonts?.ready?.then(measure, () => {});
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [isTablet, isExhibition, ORB_GAP_PX, TYPE_FALLBACK_GAP_PX, lang, status, isRecording, showSendHint, screenRef]);

  useEffect(() => {
    if (isRecording) resumeIdleAnim();
  }, [isRecording, resumeIdleAnim]);

  // Ticks once a second while actively recording; pausing freezes it in
  // place instead of continuing to count silent time.
  useEffect(() => {
    if (!isRecording || isPaused) return;
    const interval = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Resets to 0 whenever a fresh recording starts (including "repeat").
  useEffect(() => {
    if (isRecording) setElapsedSec(0);
  }, [isRecording, restartToken]);

  function handleStop() {
    setStatus("loading");
  }

  function handleCancel() {
    pendingActionRef.current = "discard";
    setIsPaused(false);
    setStatus("idle");
  }

  function handleRepeat() {
    pendingActionRef.current = "discard";
    setIsPaused(false);
    setRestartToken((n) => n + 1);
  }

  function handleTogglePause() {
    setIsPaused((p) => !p);
  }

  async function handleRecordingComplete(audio: Blob) {
    if (pendingActionRef.current === "discard") {
      pendingActionRef.current = "submit";
      return;
    }
    setStatus("loading");
    try {
      if (audio.size === 0) throw new Error("recorded audio was empty");

      const audioForm = new FormData();
      audioForm.append("audio", audio, "dream.webm");
      audioForm.append("lang", lang);
      const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: audioForm });
      if (!transcribeRes.ok) throw new Error("transcription failed");
      const { text } = await transcribeRes.json();
      if (!text) throw new Error("empty transcript");

      const dreamRes = await fetch("/api/dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      if (!dreamRes.ok) throw new Error("dream processing failed");
      const data = await dreamRes.json();

      setResult({
        id: data.id,
        name: data.name,
        imageUrl: data.imageUrl,
        clearImageUrl: data.clearImageUrl,
        printImageUrl: data.printImageUrl,
        createdAt: new Date().toISOString(),
        mood: data.mood,
        summaryText: summarize(data.analysis.themes ?? []),
        interpretationText: data.interpretationText,
        symbols: (data.analysis.symbols ?? []).slice(0, 3).map(shortSymbol),
        dreamText: text,
      });
      setStatus("result");
    } catch (err) {
      console.error("voice dream flow failed:", err);
      setStatus("error");
    }
  }

  if (status === "result" && result) {
    return <DreamResultScreen {...result} onBack={() => router.push("/gallery")} />;
  }
  if (status === "loading") {
    return <DreamLoadingScreen />;
  }

  return (
    <div
      ref={screenRef}
      className={`${styles.screen} ${bgAnimPaused ? styles.animPaused : ""} lockedScreen`}
      data-tablet={isTablet || undefined}
    >
      <div className={styles.glowBlue} />
      <div className={styles.glowPurple} />
      <div className={styles.starfield} />
      {/* Idle "come tap me" cue lives here, not as rings around the orb —
          a big, soft blue/violet wash (see @keyframes orbHeartbeatBg)
          that spreads and brightens slightly with each heartbeat pulse,
          like the whole screen breathing with the orb. */}
      {!isRecording && <div className={styles.ambientBreath} />}

      {isRecording && (
        <button
          type="button"
          className={`${styles.closeButton} ${lang === "he" ? styles.closeButtonHe : ""}`}
          onClick={handleCancel}
          aria-label={t.recordClose}
        >
          <CloseIcon size={16} />
        </button>
      )}

      <p
        ref={promptRef}
        className={`${styles.prompt} ${lang === "he" ? styles.promptHe : ""} ${isRecording ? styles.promptRecording : ""}`}
      >
        {status === "error" ? (
          t.recordError
        ) : isRecording ? (
          // Crossfades from the normal "I'm listening" copy to a "tap
          // again" hint a few seconds in, since there's no other cue that
          // tapping again submits (rather than cancels) the recording —
          // both exhibition and normal mobile.
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={showSendHint ? "hint" : "listening"}
              // Softer, slower crossfade than a plain opacity swap — same
              // "new text" convention used elsewhere in the app (fade +
              // gentle rise) and the same dreamy easing curve, just applied
              // here too instead of a flat linear-feeling fade.
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.7, ease: EASE }}
              style={{ display: "block" }}
            >
              {(showSendHint ? t.recordingPromptSendHint : t.recordingPrompt)
                .split("\n")
                .map((line, i) => (
                  <span key={i} className={styles.promptLine}>{line}</span>
                ))}
            </motion.span>
          </AnimatePresence>
        ) : lang === "he" ? (
          t.recordPrompt.split("\n").map((line, i) => (
            <span key={i} className={styles.promptLine}>{line}</span>
          ))
        ) : (
          t.recordPrompt
        )}
      </p>

      <VoiceRecordCircle
        isRecording={isRecording}
        isPaused={isPaused}
        restartToken={restartToken}
        onPermissionDenied={() => setStatus("idle")}
        onRecordingComplete={handleRecordingComplete}
        onTranscriptUpdate={() => {}}
        onAudioLevels={setAudioLevels}
        audioBarCount={AUDIO_BAR_COUNT}
      />

      <div
        ref={recordButtonWrapRef}
        className={`${styles.recordButtonWrap} ${isRecording ? styles.recordButtonWrapActive : ""}`}
        style={measuredOrbTop !== null ? { top: `${measuredOrbTop}px` } : undefined}
      >
        <button
          type="button"
          className={`${styles.recordButton} ${isRecording ? styles.recordButtonActive : ""} ${isPaused ? styles.recordButtonPaused : ""}`}
          onClick={isRecording ? handleStop : () => setStatus("recording")}
          aria-pressed={isRecording}
          aria-label="Record dream"
        >
          {/* Two stacked copies of the same static orb image instead of the
              GIF: .orbRings rotates continuously (CSS, so it's smooth and
              fully controllable), .orbCore sits on top clipped to just the
              solid inner sphere and never moves — so only the outer swirl
              appears to orbit while the core stays put, centered and
              unchanged. */}
          <div className={styles.orbLayers}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/orb.png"
              srcSet="/images/orb.png 320w, /images/orb@3x.png 960w"
              sizes="(min-width: 768px) 400px, 260px"
              alt=""
              className={styles.orbRings}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/orb.png"
              srcSet="/images/orb.png 320w, /images/orb@3x.png 960w"
              sizes="(min-width: 768px) 400px, 260px"
              alt=""
              className={styles.orbCore}
            />
          </div>
        </button>
      </div>

      {!isRecording && (
        <div
          className={styles.typeFallback}
          style={measuredTypeFallbackTop !== null ? { top: `${measuredTypeFallbackTop}px` } : undefined}
        >
          <span className={`${styles.typeFallbackOr} ${lang === "he" ? styles.typeFallbackOrHe : ""}`}>{t.recordOr}</span>
          <Link className={`${styles.typeFallbackLink} ${lang === "he" ? styles.typeFallbackLinkHe : ""}`} href="/record/type">
            {t.recordTypeIt}
          </Link>
        </div>
      )}

      {isRecording && (
        <div className={styles.controlRow}>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={handleTogglePause}
            aria-label={isPaused ? t.recordResume : t.recordPause}
          >
            {isPaused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
          </button>
          <button
            type="button"
            className={styles.recordingPill}
            onClick={handleStop}
            aria-label={t.recordStop}
            aria-live="polite"
          >
            <span className={styles.recordingWaveform} aria-hidden="true">
              {audioLevels.map((level, i) => (
                <span
                  key={i}
                  className={styles.recordingBar}
                  style={{ height: `${4 + Math.round(level * 32)}px` }}
                />
              ))}
            </span>
            <span className={styles.recordingTime}>{formatElapsed(elapsedSec)}</span>
          </button>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={handleRepeat}
            aria-label={t.recordRepeat}
          >
            <RepeatIcon size={16} />
          </button>
        </div>
      )}

    </div>
  );
}
