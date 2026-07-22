"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Which way the exhibition monitor was physically turned relative to its
// (fixed) Windows landscape orientation — flip to "ccw" if the physical
// display shows the app upside-down. See the `.exhibition-cw` /
// `.exhibition-ccw` rules in globals.css for the exact transform each
// value maps to.
const EXHIBITION_ROTATION: "cw" | "ccw" = "cw";

function ExhibitionModeInner() {
  const searchParams = useSearchParams();
  const active = searchParams.get("exhibition") === "1";

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const rotationClass = `exhibition-${EXHIBITION_ROTATION}`;

    if (active) {
      html.classList.add("exhibition");
      body.classList.add("exhibition", rotationClass);
    }

    return () => {
      html.classList.remove("exhibition");
      body.classList.remove("exhibition", "exhibition-cw", "exhibition-ccw");
    };
  }, [active]);

  return null;
}

// useSearchParams() requires a Suspense boundary to avoid opting every
// other (statically rendered) page into client-side rendering — isolating
// it here means this is the only thing affected, not the rest of the app.
export default function ExhibitionMode() {
  return (
    <Suspense fallback={null}>
      <ExhibitionModeInner />
    </Suspense>
  );
}
