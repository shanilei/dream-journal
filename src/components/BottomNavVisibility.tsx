"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Ctx = {
  hidden: boolean;
  setHidden: (v: boolean) => void;
  dimmed: boolean;
  setDimmed: (v: boolean) => void;
};

const BottomNavVisibilityContext = createContext<Ctx | null>(null);

// Mounted once in the root layout, alongside GlobalBottomNav — the single
// source of truth for whether the one persistent BottomNav instance is
// hidden/dimmed right now. Individual screens never render their own
// BottomNav; they call the hooks below to have a say in its visibility
// while they're mounted.
export function BottomNavVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const [dimmed, setDimmed] = useState(false);
  return (
    <BottomNavVisibilityContext.Provider value={{ hidden, setHidden, dimmed, setDimmed }}>
      {children}
    </BottomNavVisibilityContext.Provider>
  );
}

function useBottomNavVisibilityContext(): Ctx {
  const ctx = useContext(BottomNavVisibilityContext);
  if (!ctx) throw new Error("useBottomNavVisibilityContext must be used within BottomNavVisibilityProvider");
  return ctx;
}

// A screen calls this with whatever "should the nav be hidden right now"
// value it computes locally (e.g. isRecording, a scroll position) — it's
// automatically reset to false on unmount, so navigating away never
// leaves the next screen's nav stuck hidden.
export function useSetBottomNavHidden(hidden: boolean) {
  const { setHidden } = useBottomNavVisibilityContext();
  useEffect(() => {
    setHidden(hidden);
    return () => setHidden(false);
  }, [hidden, setHidden]);
}

// Same pattern as useSetBottomNavHidden, for the separate 0.4-opacity
// "dimmed" state (see BottomNav's own `dimmed` prop).
export function useSetBottomNavDimmed(dimmed: boolean) {
  const { setDimmed } = useBottomNavVisibilityContext();
  useEffect(() => {
    setDimmed(dimmed);
    return () => setDimmed(false);
  }, [dimmed, setDimmed]);
}

export function useBottomNavVisibilityState(): { hidden: boolean; dimmed: boolean } {
  const { hidden, dimmed } = useBottomNavVisibilityContext();
  return { hidden, dimmed };
}
