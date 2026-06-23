"use client";

import { useState } from "react";
import styles from "./UserScreen.module.css";
import BottomNav from "./BottomNav";
import { UserIcon, BellIcon } from "./Icons";
import { useTheme } from "./ThemeProvider";

const GOALS = ["Analysis", "Interpretation", "Analysis"];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`${styles.toggleTrack} ${checked ? styles.toggleOn : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleKnob} />
    </button>
  );
}

export default function UserScreen() {
  const { theme, toggleTheme } = useTheme();
  const darkMood = theme === "dark";
  const [notifications, setNotifications] = useState(true);
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  return (
    <div className={styles.screen}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />
      <div className={styles.glow3} />

      <div className={styles.content}>
        <div className={styles.topBar}>
          <button type="button" className={styles.iconButton} aria-label="Profile">
            <UserIcon size={20} color="currentColor" />
          </button>
          <button type="button" className={styles.iconButton} aria-label="Notifications">
            <BellIcon size={20} color="currentColor" />
          </button>
        </div>

        <p className={styles.title}>User Dreams</p>

        <div className={styles.ctaButton} />

        <p className={styles.sectionLabel}>My goals</p>
        <div className={styles.goalsGrid}>
          {GOALS.map((goal, i) => (
            <div key={i} className={i < 2 ? styles.goalCard : styles.goalCardWide}>
              {goal}
            </div>
          ))}
        </div>

        <p className={styles.sectionLabel}>Setting</p>
        <div className={styles.settingsCard}>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>Dark mood</span>
            <Toggle checked={darkMood} onChange={toggleTheme} label="Dark mood" />
          </div>
          <div className={styles.divider} />

          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>Recording length</span>
            <span className={styles.settingValue}>15 sec</span>
          </div>
          <div className={styles.divider} />

          <div className={styles.settingRow}>
            <span className={styles.settingLabelMuted}>Connected alarm</span>
            <span className={styles.settingValue}>07:30 AM</span>
          </div>
          <div className={styles.divider} />

          <div className={styles.settingRow}>
            <span className={styles.settingLabelMuted}>Notifications</span>
            <Toggle checked={notifications} onChange={setNotifications} label="Notifications" />
          </div>
          <div className={styles.divider} />

          <div className={styles.settingRow}>
            <span className={styles.settingLabelMuted}>Save to library</span>
            <Toggle checked={saveToLibrary} onChange={setSaveToLibrary} label="Save to library" />
          </div>
        </div>
      </div>

      <BottomNav active="user" />
    </div>
  );
}
