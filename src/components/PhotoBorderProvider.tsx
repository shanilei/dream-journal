"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "dream-journal-photo-border-v2";

const PhotoBorderContext = createContext<{ showBorder: boolean; toggleBorder: () => void } | null>(null);

export function PhotoBorderProvider({ children }: { children: ReactNode }) {
  const [showBorder, setShowBorder] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setShowBorder(stored === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(showBorder));
  }, [showBorder]);

  function toggleBorder() {
    setShowBorder((v) => !v);
  }

  return (
    <PhotoBorderContext.Provider value={{ showBorder, toggleBorder }}>{children}</PhotoBorderContext.Provider>
  );
}

export function usePhotoBorder() {
  const ctx = useContext(PhotoBorderContext);
  if (!ctx) throw new Error("usePhotoBorder must be used within PhotoBorderProvider");
  return ctx;
}
