"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import styles from "./LucidIntroAnimation.module.css";

// ─── Deterministic star field ─────────────────────────────────────────────────
const STARS = Array.from({ length: 64 }, (_, i) => ({
  id: i,
  x: (((i * 127 + 13) * 7919) % 10000) / 100,
  y: (((i * 89 + 37) * 6271) % 10000) / 100,
  r: [0.7, 1.0, 1.3, 0.9, 0.6][i % 5],
  opacity: [0.22, 0.34, 0.26, 0.40, 0.18][i % 5],
  dur: 2.4 + (i % 7) * 0.6,
  delay: (i * 0.41) % 5,
}));

// ─── Logo SVG constants (viewBox 0 0 841.89 1190.55) ─────────────────────────
const C_CX_VB = 456;
const C_CY_VB = 592;
const C_OR_VB = 89;

const LOGO_SCALE_FINAL = 0.45;
const LOGO_W = 841.89 * LOGO_SCALE_FINAL;   // ≈ 378.9px
const LOGO_H = 1190.55 * LOGO_SCALE_FINAL;  // ≈ 535.7px

const C_CX_IN_LOGO = C_CX_VB * LOGO_SCALE_FINAL;  // ≈ 205.2px
const C_CY_IN_LOGO = C_CY_VB * LOGO_SCALE_FINAL;  // ≈ 266.4px

// ─── Orb / crescent constants ─────────────────────────────────────────────────
// MOON_R = C outer-radius at 2× final scale, so the crossfade is seamless.
const MOON_R = Math.round(C_OR_VB * LOGO_SCALE_FINAL * 2);  // = 80px
const ORB_SIZE = MOON_R * 2;                                  // = 160px

const SHADOW_DX    = MOON_R * 0.30;   // 24px — shadow offset
const SHADOW_R_MAX = MOON_R * 0.80;   // 64px — crescent depth

// Padding around orb for glow rings
const PAD = 60;

export default function LucidIntroAnimation({ onComplete }: { onComplete?: () => void }) {
  const shadowR = useMotionValue(0);

  const [orbOpacity,     setOrbOpacity]     = useState(0);
  const [orbY,           setOrbY]           = useState(18);   // floats up from below
  const [logoOpacity,    setLogoOpacity]    = useState(0);
  const [logoScale,      setLogoScale]      = useState(2);
  const [lettersOpacity, setLettersOpacity] = useState(0);

  const [vw, setVw] = useState(390);
  const [vh, setVh] = useState(844);
  useEffect(() => { setVw(window.innerWidth); setVh(window.innerHeight); }, []);

  // Circle / C centre on screen
  const moonCX = vw / 2;
  const moonCY = vh * 0.44;

  // Logo top-left: positions C centre exactly at (moonCX, moonCY)
  const logoLeft = moonCX - C_CX_IN_LOGO;
  const logoTop  = moonCY - C_CY_IN_LOGO;

  // Orb container top-left (includes PAD for glow rings)
  const orbLeft = moonCX - MOON_R - PAD;
  const orbTop  = moonCY - MOON_R - PAD;

  useEffect(() => {
    let cancelled = false;
    const go = async () => {
      await sleep(300);
      if (cancelled) return;

      // 1. Orb rises and fades in
      setOrbOpacity(1);
      setOrbY(0);

      await sleep(1400);
      if (cancelled) return;

      // 2. Shadow grows → crescent carves into the orb
      await animate(shadowR, SHADOW_R_MAX, { duration: 2.0, ease: [0.4, 0, 0.15, 1] });
      if (cancelled) return;

      await sleep(350);
      if (cancelled) return;

      // 3. Logo C fades in at 2× — orb and logo-C are congruent here
      setLogoOpacity(1);
      await sleep(280);
      if (cancelled) return;

      // 4. Orb fades out
      setOrbOpacity(0);
      await sleep(180);
      if (cancelled) return;

      // 5. Logo zooms out 2× → 1×, revealing the full word
      setLogoScale(1);
      await sleep(950);
      if (cancelled) return;

      // 6. L U I D fade in
      setLettersOpacity(1);
      await sleep(850);
      if (cancelled) return;

      // 7. Hold on complete logo
      await sleep(700);
      onComplete?.();
    };
    go();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.root}>
      <div className={styles.bg} />
      <div className={styles.glowPurple} />
      <div className={styles.glowBlue} />

      {/* Stars */}
      <svg className={styles.stars} viewBox="0 0 100 100" preserveAspectRatio="none">
        {STARS.map((s) => (
          <motion.circle
            key={s.id}
            cx={s.x}
            cy={s.y}
            r={s.r * 0.12}
            fill="white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [s.opacity * 0.3, s.opacity, s.opacity * 0.5, s.opacity] }}
            transition={{ duration: s.dur, delay: s.delay + 0.5, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </svg>

      {/* Orb with crescent mask + breathing glow */}
      <div
        style={{
          position: "absolute",
          left: orbLeft,
          top: orbTop,
          opacity: orbOpacity,
          transform: `translateY(${orbY}px)`,
          transition: "opacity 0.9s ease, transform 1.4s cubic-bezier(0.22, 1, 0.36, 1)",
          pointerEvents: "none",
        }}
      >
        <svg
          width={(MOON_R + PAD) * 2}
          height={(MOON_R + PAD) * 2}
          overflow="visible"
        >
          <defs>
            <mask id="orbMask">
              <rect
                x={0} y={0}
                width={(MOON_R + PAD) * 2}
                height={(MOON_R + PAD) * 2}
                fill="white"
              />
              <motion.circle
                cx={MOON_R + PAD + SHADOW_DX}
                cy={MOON_R + PAD}
                fill="black"
                style={{ r: shadowR }}
              />
            </mask>

            <filter id="orbGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Breathing outer glow rings */}
          <motion.circle
            cx={MOON_R + PAD}
            cy={MOON_R + PAD}
            r={MOON_R * 1.55}
            fill="rgba(130,110,255,0.12)"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx={MOON_R + PAD}
            cy={MOON_R + PAD}
            r={MOON_R * 1.22}
            fill="rgba(160,140,255,0.16)"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />

          {/* Orb image — crescent mask applied */}
          <image
            href="/images/orb-anim.gif"
            x={PAD}
            y={PAD}
            width={ORB_SIZE}
            height={ORB_SIZE}
            mask="url(#orbMask)"
          />
        </svg>
      </div>

      {/* Logo — starts at 2× (C aligns with orb), zooms out to final size */}
      <motion.div
        style={{
          position: "absolute",
          left: logoLeft,
          top: logoTop,
          width: LOGO_W,
          height: LOGO_H,
          pointerEvents: "none",
          transformOrigin: `${C_CX_IN_LOGO}px ${C_CY_IN_LOGO}px`,
        }}
        initial={{ opacity: 0, scale: 2 }}
        animate={{ opacity: logoOpacity, scale: logoScale }}
        transition={{
          opacity: { duration: 0.45, ease: "easeInOut" },
          scale:   { duration: 0.9,  ease: [0.22, 1, 0.36, 1] },
        }}
      >
        <svg
          viewBox="0 0 841.89 1190.55"
          width={LOGO_W}
          height={LOGO_H}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* C — always visible; seamlessly continues the orb */}
          <path
            fill="white"
            d="M520.96,513.83c-5.95-3.03-14.92-6.79-26.32-8.65-4.22-.69-32.08-4.85-58.58,9.97-32.9,18.39-53.58,60.36-44.36,99.45,7.29,30.93,30.39,47.74,35.78,51.45,7.02,4.84,29.96,19.15,60.09,15.15,13.39-1.78,23.68-6.58,30-10.16-44.66.83-81.32-35.47-81.42-78.49-.1-44.4,38.76-81.51,84.8-78.71"
          />

          {/* L U I D — appear after the zoom-out lands */}
          <g style={{ opacity: lettersOpacity, transition: "opacity 0.8s ease" }}>
            <path fill="white" d="M67.94,502.51h28.61c-.55,27.85-.69,59.05,0,92.18.15,7.47.48,17.73,6.36,28.61,12.61,23.34,39.83,29.32,42.59,29.88,11.05,2.25,20.41,1.12,26.06,0v27.97c-8.99,1.66-26.88,3.6-47.04-3.81-4.14-1.52-33.6-12.86-48.31-43.23-5.39-11.13-6.95-20.99-8.26-41.5-1.41-21.98-2.3-52.63,0-90.1Z" />
            <path fill="white" d="M189.56,508.63h28.32c1.01,36.83,1.9,68.1,2.52,95.67.08,3.69.22,10.05,3.15,17.62,7.89,20.44,32.67,40.94,62.31,38.4,26.63-2.29,45.09-22.14,52.24-39.65,2.27-5.55,3.25-10.5,3.73-13.97,0-.53.67-50.33.68-50.86,0-.46.62-46.75.63-47.21h27.7v96.3c-.47,9.13-2.66,26.34-13.85,43.43-24.8,37.9-70.48,39.58-74.3,39.65-6.41.13-39.34.11-66.07-25.81-21.35-20.7-25.92-45.49-27.07-53.5v-100.08Z" />
            <path fill="white" d="M538.95,681.24h30.02v-177.29h-30.02v177.29Z" />
            <path fill="white" d="M726,543.44c-19.95-29.91-51.2-38-59-39.79h-80.03v177.9h79.58c5.86-.92,43.01-7.36,63.57-41.16,19.44-31.96,13.33-70.79-4.12-96.95ZM711.82,608.83c-8.57,33.75-41.26,44.29-42.99,44.82h-53.96v-122.11h43.9c6.17.77,22.4,3.65,36.13,16.92,15.6,15.08,22.53,38.3,16.92,60.37Z" />
          </g>
        </svg>
      </motion.div>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
