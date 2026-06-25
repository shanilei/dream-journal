"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./DreamCardStack.module.css";

const FALLBACK_CARDS = [
  { id: "fallback-1", image: "/images/cards/dream-1.png", mood: "Sweet", date: "May 24", time: "10:30" },
  { id: "fallback-2", image: "/images/cards/dream-2.png", mood: "Confusion", date: "May 24", time: "10:30" },
  { id: "fallback-3", image: "/images/cards/dream-3.png", mood: "Confusion", date: "May 24", time: "10:30" },
];

// front -> middle -> back, lifted from the original Figma stack positions
const SLOTS = [
  { leftPct: 63.4, topPct: 40.8, rotateDeg: 6.92 },
  { leftPct: 56.1, topPct: 38.56, rotateDeg: -5.1 },
  { leftPct: 37.6, topPct: 41.23, rotateDeg: -11.17 },
];

const SWIPE_THRESHOLD = 80;
const TAP_THRESHOLD = 6;
const FLY_DISTANCE = 500;
const FLY_DURATION = 350;

export interface DreamCard {
  id: string;
  image: string;
  mood: string;
  date: string;
  time: string;
}

export default function DreamCardStack({ cards }: { cards?: DreamCard[] }) {
  const CARDS = cards && cards.length > 0 ? cards : FALLBACK_CARDS;
  const router = useRouter();
  const [deckOrder, setDeckOrder] = useState(() => CARDS.map((_, i) => i));
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flying, setFlying] = useState<"left" | "right" | null>(null);
  const startXRef = useRef(0);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (flying) return;
    setDragging(true);
    startXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setDragX(e.clientX - startXRef.current);
  }

  function handlePointerUp(cardId: string) {
    if (!dragging) return;
    setDragging(false);
    if (Math.abs(dragX) > SWIPE_THRESHOLD) {
      const direction = dragX > 0 ? "right" : "left";
      setFlying(direction);
      setTimeout(() => {
        setDeckOrder((prev) => [...prev.slice(1), prev[0]]);
        setFlying(null);
        setDragX(0);
      }, FLY_DURATION);
    } else {
      if (Math.abs(dragX) < TAP_THRESHOLD) {
        router.push(`/dream/${cardId}`);
      }
      setDragX(0);
    }
  }

  return (
    <div className={styles.cardStack}>
      {deckOrder.map((cardIndex, position) => {
        const card = CARDS[cardIndex];
        const slot = SLOTS[position];
        const isFront = position === 0;

        let transform = `translate(-50%, -50%) rotate(${slot.rotateDeg}deg)`;
        let opacity = 1;

        if (isFront && flying) {
          const flyX = flying === "right" ? FLY_DISTANCE : -FLY_DISTANCE;
          const flyRotate = flying === "right" ? 40 : -40;
          transform = `translate(calc(-50% + ${flyX}px), -65%) rotate(${flyRotate}deg)`;
          opacity = 0;
        } else if (isFront && (dragging || dragX !== 0)) {
          const tilt = dragX / 18;
          transform = `translate(calc(-50% + ${dragX}px), -50%) rotate(${slot.rotateDeg + tilt}deg)`;
        }

        return (
          <div
            key={cardIndex}
            className={`${styles.dreamCard} ${isFront ? styles.dreamCardFront : ""} ${
              isFront && dragging ? styles.dreamCardDragging : ""
            }`}
            style={{
              left: `${slot.leftPct}%`,
              top: `${slot.topPct}%`,
              transform,
              opacity,
              zIndex: 3 - position,
            }}
            onPointerDown={isFront ? handlePointerDown : undefined}
            onPointerMove={isFront ? handlePointerMove : undefined}
            onPointerUp={isFront ? () => handlePointerUp(card.id) : undefined}
            onPointerCancel={isFront ? () => handlePointerUp(card.id) : undefined}
            onClick={!isFront ? () => router.push(`/dream/${card.id}`) : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.dreamCardImg} src={card.image} alt="" draggable={false} />
            <div className={styles.dreamCardFrost} />
            <div className={styles.dreamCardFooter}>
              <span className={styles.moodTag}>{card.mood}</span>
              <span className={styles.metaGroup}>
                <span className={styles.metaText}>{card.date}</span>
                <span className={styles.metaText}>{card.time}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
