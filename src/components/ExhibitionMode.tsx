"use client";

import { Suspense, createContext, useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

// `active` below is derived synchronously from useSearchParams() on every
// render, so exposing it via context lets consumers read it during their
// own first render — no DOM-class-sniffing, no effect-ordering race.
// (Screens used to each independently check
// document.documentElement.classList.contains("exhibition") inside their
// own useEffect — React fires effects child-first on mount, so a deeply
// nested screen's own check could run *before* ExhibitionModeInner's own
// effect below had added the class, silently sticking at `false` forever
// since each was a run-once effect.)
const ExhibitionContext = createContext(false);

export function useIsExhibition(): boolean {
  return useContext(ExhibitionContext);
}

const EXHIBITION_STORAGE_KEY = "dj_exhibition";
const EXHIBITION_PREVIEW_STORAGE_KEY = "dj_exhibition_preview";

function readStoredFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

// Which way the exhibition monitor was physically turned relative to its
// (fixed) Windows landscape orientation — flip to "ccw" if the physical
// display shows the app upside-down.
const EXHIBITION_ROTATION: "cw" | "ccw" = "cw";

// The virtual portrait canvas every screen renders into while Exhibition
// Mode is active — kept in sync with the --exhibition-width/height custom
// properties defined in globals.css (duplicated as numbers here only
// because inline transform math needs plain numbers, not CSS var() calc).
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

function computeCanvasTransform(rotate: boolean): string {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // The box the (unrotated) canvas must fit inside. When the physical
  // browser viewport is landscape, the canvas is rotated 90deg, so the
  // canvas's own width fits against the viewport's height and vice versa.
  const fitWidth = rotate ? viewportHeight : viewportWidth;
  const fitHeight = rotate ? viewportWidth : viewportHeight;

  const scale = Math.min(fitWidth / CANVAS_WIDTH, fitHeight / CANVAS_HEIGHT);
  const degrees = rotate ? (EXHIBITION_ROTATION === "cw" ? 90 : -90) : 0;

  return `translate(-50%, -50%) rotate(${degrees}deg) scale(${scale})`;
}

// The outer physical stage + inner 1080x1920 virtual portrait canvas.
// Only the canvas (this one element) is ever rotated/scaled — everything
// mounted inside it renders as a normal, unrotated portrait layout, so no
// individual screen or component needs to know Exhibition Mode exists.
function ExhibitionCanvas({
  children,
  preview,
}: {
  children: React.ReactNode;
  preview: boolean;
}) {
  const [transform, setTransform] = useState<string | null>(null);

  useEffect(() => {
    function recompute() {
      const isPhysicallyLandscape = window.innerWidth > window.innerHeight;
      setTransform(computeCanvasTransform(isPhysicallyLandscape && !preview));
    }

    recompute();
    window.addEventListener("resize", recompute);
    window.addEventListener("orientationchange", recompute);
    return () => {
      window.removeEventListener("resize", recompute);
      window.removeEventListener("orientationchange", recompute);
    };
  }, [preview]);

  return (
    <div className="exhibitionStage">
      <div
        className="exhibitionCanvas"
        // Rendered with no transform for exactly one frame (before the
        // effect above measures the real viewport) rather than a guessed
        // default — an untransformed canvas is simply invisible-until-
        // ready instead of briefly flashing at the wrong scale/rotation.
        style={transform ? { transform } : { visibility: "hidden" }}
      >
        {children}
      </div>
    </div>
  );
}

function ExhibitionModeInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const urlActive = searchParams.get("exhibition") === "1";
  // ?exhibition=1&preview=1 — a local, upright stand-in for the physical
  // installation (same 1080x1920 canvas, scaled to fit, but never
  // rotated) so spacing/scale/typography can be checked on a normal
  // desktop browser without walking over to the rotated monitor.
  const urlPreview = searchParams.get("preview") === "1";

  // Exhibition mode is meant to hold for an entire kiosk session, but
  // ?exhibition=1 only lives on whatever URL was first opened — no
  // internal <Link>/router.push in the app (BottomNav's tabs, the
  // Gallery's card links, the idle-timeout redirect) appends it, so the
  // very next client-side navigation's URL genuinely no longer carries
  // it, and `active` would otherwise flip back to false mid-session.
  // Lazily initialized from localStorage (not a useEffect) so it's
  // already correct on the very first render of any later page — no
  // effect-ordering race — and it's set the moment a real ?exhibition=1
  // URL is seen. localStorage (not sessionStorage) so a kiosk browser
  // that crashes/restarts and reopens to whatever URL it last had —
  // almost never the original ?exhibition=1 one — still comes back up
  // in exhibition mode instead of silently falling back to the
  // phone-shell layout in the middle of the physical display.
  const [storedActive, setStoredActive] = useState(() => readStoredFlag(EXHIBITION_STORAGE_KEY));
  const [storedPreview, setStoredPreview] = useState(() => readStoredFlag(EXHIBITION_PREVIEW_STORAGE_KEY));

  useEffect(() => {
    if (!urlActive) return;
    try {
      localStorage.setItem(EXHIBITION_STORAGE_KEY, "1");
      if (urlPreview) localStorage.setItem(EXHIBITION_PREVIEW_STORAGE_KEY, "1");
    } catch {
      // private browsing or storage disabled — falls back to in-memory
      // state below, which still covers same-tab navigation, just not a
      // hard reload.
    }
    setStoredActive(true);
    if (urlPreview) setStoredPreview(true);
  }, [urlActive, urlPreview]);

  const active = urlActive || storedActive;
  const preview = active && (urlActive ? urlPreview : storedPreview);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (active) {
      html.classList.add("exhibition");
      body.classList.add("exhibition");
    }

    return () => {
      html.classList.remove("exhibition");
      body.classList.remove("exhibition");
    };
  }, [active]);

  if (!active) {
    return <ExhibitionContext.Provider value={false}>{children}</ExhibitionContext.Provider>;
  }

  return (
    <ExhibitionContext.Provider value={true}>
      <ExhibitionCanvas preview={preview}>{children}</ExhibitionCanvas>
    </ExhibitionContext.Provider>
  );
}

// useSearchParams() requires a Suspense boundary to avoid opting every
// other (statically rendered) page into client-side rendering — isolating
// it here means this is the only thing affected, not the rest of the app.
// When Exhibition Mode isn't active, the fallback renders `children`
// directly (identical DOM to before this component existed) so the
// Suspense boundary itself never changes anything about the normal app.
export default function ExhibitionMode({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <ExhibitionModeInner>{children}</ExhibitionModeInner>
    </Suspense>
  );
}
