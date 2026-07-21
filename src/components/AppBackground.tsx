import styles from "./AppBackground.module.css";

// Mounted once in the root layout, above every route — see the comment in
// AppBackground.module.css for why. z-index:-1 keeps it fully behind each
// screen's own background/content at all times; it's never meant to be
// seen on its own, only to prevent a gap ever showing through beneath one.
export default function AppBackground() {
  return <div className={styles.bg} />;
}
