"use client";

import { useState } from "react";
import styles from "./UserScreen.module.css";
import BottomNav from "./BottomNav";
import { UserIcon, BellIcon } from "./Icons";
import { useTheme } from "./ThemeProvider";
import { useLanguage } from "./LanguageProvider";
import { usePhotoBorder } from "./PhotoBorderProvider";

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
  const { lang, toggleLang, t } = useLanguage();
  const { showBorder, toggleBorder } = usePhotoBorder();
  const darkMood = theme === "dark";
  const isHebrew = lang === "he";
  const [notifications, setNotifications] = useState(true);
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  const stats = [
    { value: "32", label: t.thisMonth },
    { value: "12 Days in a row", label: t.dreamStreak },
    { value: "Water", label: t.mostCommonSymbol },
    { value: "Anxious", label: t.averageMood },
  ];

  return (
    <div className={styles.screen}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />
      <div className={styles.glow3} />

      <div className={styles.content}>
        <div className={styles.topBar}>
          <button type="button" className={styles.iconButton} aria-label="Profile">
            <UserIcon size={16} color="currentColor" />
          </button>
          <button type="button" className={styles.iconButton} aria-label="Notifications">
            <BellIcon size={16} color="currentColor" />
          </button>
        </div>

        <p className={styles.title}>{t.userTitle}</p>

        <p className={styles.sectionLabel}>{t.myGoals}</p>
        <div className={styles.goalsGrid}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.goalCard}>
              <p className={styles.goalValue}>{stat.value}</p>
              <p className={styles.goalLabel}>{stat.label}</p>
            </div>
          ))}
        </div>

        <p className={styles.sectionLabel}>{t.setting}</p>
        <div className={styles.settingsCard}>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>{t.darkMood}</span>
            <Toggle checked={darkMood} onChange={toggleTheme} label={t.darkMood} />
          </div>
          <div className={styles.divider} />

          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>{t.hebrewMode}</span>
            <Toggle checked={isHebrew} onChange={toggleLang} label={t.hebrewMode} />
          </div>
          <div className={styles.divider} />

          <div className={styles.settingRow}>
            <span className={styles.settingLabelMuted}>{t.connectedAlarm}</span>
            <span className={styles.settingValue}>07:30 AM</span>
          </div>
          <div className={styles.divider} />

          <div className={styles.settingRow}>
            <span className={styles.settingLabelMuted}>{t.notifications}</span>
            <Toggle checked={notifications} onChange={setNotifications} label={t.notifications} />
          </div>
          <div className={styles.divider} />

          <div className={styles.settingRow}>
            <span className={styles.settingLabelMuted}>{t.saveToLibrary}</span>
            <Toggle checked={saveToLibrary} onChange={setSaveToLibrary} label={t.saveToLibrary} />
          </div>
          <div className={styles.divider} />

          <div className={styles.settingRow}>
            <span className={styles.settingLabelMuted}>{t.photoBorder}</span>
            <Toggle checked={showBorder} onChange={toggleBorder} label={t.photoBorder} />
          </div>
        </div>
      </div>

      <BottomNav active="user" />
    </div>
  );
}
