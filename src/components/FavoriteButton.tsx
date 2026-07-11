"use client";

import { useState } from "react";
import styles from "./FavoriteButton.module.css";
import { HeartIcon } from "./Icons";

const PARTICLE_COUNT = 5;
const BURST_MS = 3000;

type Particle = { id: number; dx: number; delay: number; scale: number };

export default function FavoriteButton({
  filled,
  onToggle,
  size = 20,
  color,
  className,
  label,
}: {
  filled: boolean;
  onToggle: (e: React.MouseEvent) => void;
  size?: number;
  /* Left unset by default so the button's `color` CSS property (and thus
     the icon's `currentColor`) inherits normally from `className` — only
     pass this to override that. */
  color?: string;
  className?: string;
  label?: string;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);

  function handleClick(e: React.MouseEvent) {
    // Only on the "adding to favorites" transition, not on removing —
    // `filled` here is still the pre-click value.
    if (!filled) {
      setParticles(
        Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
          id: Date.now() + i,
          dx: Math.round((Math.random() - 0.5) * 34),
          delay: i * 90,
          scale: 0.55 + Math.random() * 0.4,
        }))
      );
      window.setTimeout(() => setParticles([]), BURST_MS);
    }
    onToggle(e);
  }

  return (
    <button
      type="button"
      className={`${styles.heartBtn} ${className ?? ""}`}
      aria-label={label ?? "Favourite"}
      aria-pressed={filled}
      onClick={handleClick}
      style={{ color }}
    >
      <span className={styles.iconAnchor}>
        {particles.map((p) => (
          <span
            key={p.id}
            className={styles.risingHeart}
            style={{ "--dx": `${p.dx}px`, "--delay": `${p.delay}ms`, "--scale": p.scale } as React.CSSProperties}
            aria-hidden="true"
          >
            <HeartIcon size={12} color="currentColor" filled />
          </span>
        ))}
        <HeartIcon size={size} color="currentColor" filled={filled} />
      </span>
    </button>
  );
}
