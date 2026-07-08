import styles from "./OnboardingBackground.module.css";

// Mounted once, above the whole onboarding flow — never remounts as `phase`
// changes, so the glow/starfield never hard-cuts between screens.
export default function OnboardingBackground() {
  return (
    <div className={styles.bg}>
      <div className={styles.glowNavy} />
      <div className={styles.glowBlue} />
      <div className={styles.glowPurple} />
      <div className={styles.starsFar} />
      <div className={styles.starsNear} />
    </div>
  );
}
