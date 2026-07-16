"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Every screen's background (the pulsing gradient, twinkling starfield,
// drifting glow blobs, the record orb's rotating rings) is decorative —
// it's meant to give a screen life for the first moment it's on, not to
// spin forever burning GPU/battery while the user reads or waits. This
// hook is the one place that timing/visibility policy lives, so every
// screen pauses and resumes the same way instead of five slightly
// different ad-hoc implementations.
//
// Consumers attach `ref` to the screen's root element and add the
// returned `paused` boolean as a conditional class (e.g.
// `${styles.screen} ${paused ? styles.animPaused : ""}`); the CSS module
// then defines `.animPaused`/its descendant selectors as
// `animation-play-state: paused` on whatever is normally `infinite`.
// Nothing here ever touches `display`, unmounts a node, or restarts an
// animation from 0% — a paused CSS animation costs the browser ~nothing
// (no style/layout/paint work is scheduled for it) while looking frozen
// exactly where it was, so resuming continues the same cycle rather than
// visibly "jumping".
export function useIdleAnimationPause({
  idleMs = 4000,
}: {
  /** How long to wait with no interaction before auto-pausing. Per spec, ~3–5s. */
  idleMs?: number;
} = {}) {
  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const scheduleIdlePause = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = window.setTimeout(() => setPaused(true), idleMs);
  }, [clearIdleTimer, idleMs]);

  // Explicit resume — call this from domain-specific triggers (recording
  // started, orb tapped, screen re-entered). Immediately un-pauses, then
  // re-arms the idle timer so it settles back down on its own again.
  const resume = useCallback(() => {
    setPaused(false);
    scheduleIdlePause();
  }, [scheduleIdlePause]);

  useEffect(() => {
    const el = rootRef.current;

    // Runs once the moment this screen mounts — decorative motion plays
    // by default and pauses on its own if nothing else pauses it first.
    scheduleIdlePause();

    // First touch/click anywhere on the screen: the user is now engaging
    // with it, so the ambient motion has done its job — pause right away
    // instead of waiting out the rest of the idle window.
    function onFirstInteraction() {
      clearIdleTimer();
      setPaused(true);
    }
    el?.addEventListener("pointerdown", onFirstInteraction, { once: true, passive: true });

    // Tab/app backgrounded: stop immediately (no reason to keep a timer
    // alive for a screen nobody can see), and pick back up the moment
    // it's foregrounded again.
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        resume();
      } else {
        clearIdleTimer();
        setPaused(true);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Scrolled/covered out of view vs. back into view — mostly a no-op
    // for full-viewport screens (always intersecting while mounted), but
    // correct and cheap for any decorative element that could end up
    // off-screen without unmounting.
    let observer: IntersectionObserver | undefined;
    if (el && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          resume();
        } else {
          clearIdleTimer();
          setPaused(true);
        }
      });
      observer.observe(el);
    }

    return () => {
      clearIdleTimer();
      el?.removeEventListener("pointerdown", onFirstInteraction);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer?.disconnect();
    };
    // Intentionally mount-only: resume/scheduleIdlePause/clearIdleTimer
    // are stable across the component's lifetime (see their useCallback
    // deps), and re-running this per render would rebind listeners for
    // no benefit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { paused, rootRef, resume };
}
