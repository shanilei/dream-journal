"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./BottomNav.module.css";
import { AddAIIcon, GalleryIcon, UserIcon, CloseIcon, MicIcon, PencilIcon } from "./Icons";
import { useLanguage } from "./LanguageProvider";

type NavKey = "record" | "user" | "dreams";

const LONG_PRESS_MS = 3000;
const EASE = [0.22, 1, 0.36, 1] as const;

// Each tab's own "home" — tapping an already-active tab goes back here
// instead of just re-navigating to wherever its Link happens to point.
const ROOT_PATHS: Record<NavKey, string> = {
  record: "/record",
  user: "/user",
  dreams: "/gallery",
};

// No single ref reaches every screen's own scroll container from here (most
// screens scroll an inner `.content` div, not the window), so this just
// resets whatever's actually scrolled instead of guessing a class name.
function scrollActiveScreenToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.querySelectorAll<HTMLElement>("*").forEach((el) => {
    if (el.scrollTop > 0) el.scrollTo({ top: 0, behavior: "smooth" });
  });
}

export default function BottomNav({
  active,
  hidden = false,
}: {
  active: NavKey;
  hidden?: boolean;
}) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  // Tapping the tab you're already in: on its root page, just scroll back
  // to the top; on a nested screen under that section (e.g. a dream detail
  // page while "dreams" is active), replace to the section root instead of
  // pushing — repeated taps then never pile up duplicate history entries.
  function handleRootReselect(key: NavKey): boolean {
    if (active !== key) return false;
    const root = ROOT_PATHS[key];
    if (pathname === root) {
      scrollActiveScreenToTop();
    } else {
      router.replace(root);
    }
    return true;
  }
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  // The timer can fire while the finger/pointer is still down — React
  // swaps the Link for the Close button right then, so the pointerup/
  // click that follows can land on that new button and would otherwise
  // close the menu in the same gesture that just opened it. Ignore
  // close-triggering clicks for a short window right after opening.
  const openedAtRef = useRef(0);

  function closeMenu() {
    if (Date.now() - openedAtRef.current < 400) return;
    setExpanded(false);
  }

  function clearLongPressTimer() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    window.removeEventListener("scroll", clearLongPressTimer, true);
  }

  function startLongPress() {
    longPressFiredRef.current = false;
    clearLongPressTimer();
    // Capture-phase + window so scrolling in any nested scroll container
    // (every screen's own .screen div, not just window) cancels the
    // press — scroll events don't bubble, but capturing listeners still
    // see them on the way down regardless.
    window.addEventListener("scroll", clearLongPressTimer, true);
    longPressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      openedAtRef.current = Date.now();
      setExpanded(true);
      clearLongPressTimer();
    }, LONG_PRESS_MS);
  }

  // Cleanup on unmount (covers route changes away from a page with a
  // press mid-flight, too).
  useEffect(() => clearLongPressTimer, []);

  // Escape-to-close (desktop) + lock background scroll while the menu's
  // open — matches how modal-like overlays elsewhere in the app behave.
  useEffect(() => {
    if (!expanded) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setExpanded(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [expanded]);

  const items: { key: NavKey; href: string; icon: (color: string) => React.ReactNode }[] = [
    { key: "user", href: "/user", icon: (c) => <UserIcon color={c} size={22} /> },
    { key: "dreams", href: "/gallery", icon: (c) => <GalleryIcon color={c} size={22} /> },
  ];

  return (
    <>
      <AnimatePresence>
        {expanded && (
          <motion.div
            className={styles.addMenuBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            onClick={closeMenu}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <nav
        className={`${styles.nav} ${hidden ? styles.navHidden : ""}`}
        aria-hidden={hidden}
        inert={hidden || undefined}
      >
        {/* Left item (user) — also anchors the Record pill directly above
            itself (position: relative + the pill's left:50% inside it),
            instead of guessing a pixel offset from the center button
            that drifted out of alignment on wider/tablet nav layouts.
            The pill sits as a sibling of the dimmed-opacity circle, not
            nested inside it — otherwise it would inherit that 0.4
            opacity itself and never look fully white. */}
        <div className={styles.navItemSlot}>
          <AnimatePresence>
            {expanded && (
              <motion.div
                className={styles.addMenuPillWrap}
                initial={{ opacity: 0, scale: 0.9, y: 6, x: 0, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 20.5, rotate: -8 }}
                exit={{ opacity: 0, scale: 0.9, y: 6, x: 0, rotate: 0 }}
                transition={{ duration: 0.32, ease: EASE }}
              >
                <Link href="/record" className={styles.addMenuPill} onClick={() => setExpanded(false)}>
                  <MicIcon size={18} color="#000" />
                  <span className={styles.addMenuPillLabel}>{t.navRecord}</span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            animate={{ opacity: expanded ? 0.4 : 1 }}
            transition={{ duration: 0.2, ease: EASE }}
            style={{ pointerEvents: expanded ? "none" : undefined }}
          >
            <Link
              href={items[0].href}
              className={`${styles.circle} ${active === items[0].key ? styles.active : ""}`}
              aria-disabled={expanded}
              tabIndex={expanded ? -1 : undefined}
              onClick={(e) => {
                if (expanded) { e.preventDefault(); return; }
                if (handleRootReselect(items[0].key)) e.preventDefault();
              }}
            >
              <span className={styles.iconLayer}>{items[0].icon(active === items[0].key ? "#000624" : "#fff")}</span>
            </Link>
          </motion.div>
        </div>

        {/* Middle item (record) — long-press target, morphs into Close */}
        <div className={styles.centerSlot}>
          {expanded ? (
            <button
              type="button"
              className={`${styles.circle} ${styles.expanded}`}
              aria-label={t.navAddMenuClose}
              onClick={closeMenu}
            >
              <span className={styles.iconLayer}>
                <CloseIcon size={22} color="#000624" />
              </span>
            </button>
          ) : (
            <Link
              href="/record"
              className={`${styles.circle} ${active === "record" ? styles.active : ""}`}
              aria-label={t.navAddMenu}
              onPointerDown={startLongPress}
              onPointerUp={clearLongPressTimer}
              onPointerCancel={clearLongPressTimer}
              onPointerLeave={clearLongPressTimer}
              onClick={(e) => {
                clearLongPressTimer();
                if (longPressFiredRef.current) {
                  e.preventDefault();
                  return;
                }
                if (handleRootReselect("record")) e.preventDefault();
              }}
            >
              <span className={styles.iconLayer}>
                <AddAIIcon color={active === "record" ? "#000624" : "#fff"} size={26} />
              </span>
            </Link>
          )}
        </div>

        {/* Right item (dreams) — anchors the Write pill directly above
            itself, same reasoning (and same "pill is a sibling, not a
            child, of the dimmed circle") as the left item above. */}
        <div className={styles.navItemSlot}>
          <AnimatePresence>
            {expanded && (
              <motion.div
                className={styles.addMenuPillWrap}
                initial={{ opacity: 0, scale: 0.9, y: 6, x: 0, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: -20.5, rotate: 8 }}
                exit={{ opacity: 0, scale: 0.9, y: 6, x: 0, rotate: 0 }}
                transition={{ duration: 0.32, ease: EASE }}
              >
                <Link href="/record/type" className={styles.addMenuPill} onClick={() => setExpanded(false)}>
                  <PencilIcon size={18} color="#000" />
                  <span className={styles.addMenuPillLabel}>{t.navWrite}</span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            animate={{ opacity: expanded ? 0.4 : 1 }}
            transition={{ duration: 0.2, ease: EASE }}
            style={{ pointerEvents: expanded ? "none" : undefined }}
          >
            <Link
              href={items[1].href}
              className={`${styles.circle} ${active === items[1].key ? styles.active : ""}`}
              aria-disabled={expanded}
              tabIndex={expanded ? -1 : undefined}
              onClick={(e) => {
                if (expanded) { e.preventDefault(); return; }
                if (handleRootReselect(items[1].key)) e.preventDefault();
              }}
            >
              <span className={styles.iconLayer}>{items[1].icon(active === items[1].key ? "#000624" : "#fff")}</span>
            </Link>
          </motion.div>
        </div>
      </nav>
    </>
  );
}
