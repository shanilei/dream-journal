"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from "framer-motion";

// Counts up from 0 → value on mount (e.g. "24" or "86%") — reused anywhere
// a stat needs to feel like it's settling into place rather than just
// appearing. `format` lets callers keep a suffix (like "%") without the
// counting logic needing to know about it.
export default function AnimatedNumber({
  value,
  duration = 0.6,
  delay = 0,
  format = (n: number) => String(n),
  className,
}: {
  value: number;
  duration?: number;
  delay?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spanRef = useRef<HTMLSpanElement>(null);

  useMotionValueEvent(motionValue, "change", (latest) => {
    if (spanRef.current) spanRef.current.textContent = format(Math.round(latest));
  });

  useEffect(() => {
    if (prefersReducedMotion) {
      motionValue.set(value);
      if (spanRef.current) spanRef.current.textContent = format(value);
      return;
    }
    const controls = animate(motionValue, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, delay, prefersReducedMotion]);

  return (
    <span ref={spanRef} className={className}>
      {format(0)}
    </span>
  );
}
