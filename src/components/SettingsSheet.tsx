"use client";

import { Fragment, useState } from "react";
import styles from "./SettingsSheet.module.css";
import { useTheme } from "./ThemeProvider";
import { useLanguage } from "./LanguageProvider";
import { usePhotoBorder } from "./PhotoBorderProvider";
import {
  AlarmIcon,
  LanguageAIcon,
  CrescentMoonIcon,
  DocumentIcon,
  SaveIcon,
  ChevronRightIcon,
  UpDownChevronIcon,
  CheckmarkIcon,
} from "./Icons";

type DropdownOption = { label: string; value: string };

function SettingsDropdown({
  options,
  selected,
  onSelect,
  onClose,
}: {
  options: DropdownOption[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className={styles.dropdownBackdrop} onClick={onClose} />
      <div className={styles.dropdown}>
        {options.map((opt, i) => (
          <Fragment key={opt.value}>
            {i > 0 && <div className={styles.dropdownDivider} />}
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => { onSelect(opt.value); onClose(); }}
            >
              {opt.value === selected ? (
                <CheckmarkIcon size={13} color="#000" />
              ) : (
                <span className={styles.dropdownSpacer} />
              )}
              <span className={styles.dropdownItemLabel}>{opt.label}</span>
            </button>
          </Fragment>
        ))}
      </div>
    </>
  );
}

function ValueRow({
  icon,
  label,
  value,
  onClick,
  dropdownOptions,
  selectedValue,
  onSelectOption,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
  dropdownOptions?: DropdownOption[];
  selectedValue?: string;
  onSelectOption?: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  function handleClick() {
    if (dropdownOptions && dropdownOptions.length > 0) {
      setIsOpen((o) => !o);
    } else {
      onClick?.();
    }
  }

  return (
    <div className={styles.rowWrapper}>
      <button type="button" className={styles.row} onClick={handleClick}>
        <span className={styles.rowIcon}>{icon}</span>
        <span className={styles.rowLabel}>{label}</span>
        <span className={styles.rowValueGroup}>
          <span className={styles.rowValue}>{value}</span>
          <UpDownChevronIcon size={16} />
        </span>
      </button>
      {isOpen && dropdownOptions && (
        <SettingsDropdown
          options={dropdownOptions}
          selected={selectedValue ?? value}
          onSelect={(v) => { onSelectOption?.(v); }}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

function ActionRow({ label, flip }: { label: string; flip?: boolean }) {
  return (
    <button type="button" className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span style={flip ? { transform: "scaleX(-1)", display: "inline-flex" } : undefined}>
        <ChevronRightIcon size={18} color="rgba(255,255,255,0.45)" />
      </span>
    </button>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className={styles.row}>
      <span className={styles.rowIcon}>{icon}</span>
      <span className={styles.rowLabel}>{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`${styles.toggleTrack} ${checked ? styles.toggleOn : ""}`}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
    >
      <span className={styles.toggleKnob} />
    </button>
  );
}

type InterpLength = "short" | "medium" | "long";

export default function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, t, toggleLang } = useLanguage();
  const { showBorder, toggleBorder } = usePhotoBorder();
  const [isClosing, setIsClosing] = useState(false);
  const [interpLength, setInterpLength] = useState<InterpLength>("long");
  const isHe = lang === "he";

  function handleClose() {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 320);
  }

  const langOptions: DropdownOption[] = [
    { value: "he", label: "עברית" },
    { value: "en", label: isHe ? "אנגלית" : "English" },
  ];

  const modeOptions: DropdownOption[] = [
    { value: "dark", label: t.settingsDark },
    { value: "light", label: t.settingsLight },
  ];

  const interpOptions: DropdownOption[] = isHe
    ? [
        { value: "short", label: "קצר" },
        { value: "medium", label: "בינוני" },
        { value: "long", label: t.settingsLong },
      ]
    : [
        { value: "short", label: "Short" },
        { value: "medium", label: "Medium" },
        { value: "long", label: t.settingsLong },
      ];

  const interpLabel = interpOptions.find((o) => o.value === interpLength)?.label ?? t.settingsLong;

  const sectionLabelClass = isHe
    ? `${styles.sectionLabelLarge} ${styles.sectionLabelHe}`
    : styles.sectionLabelLarge;

  return (
    <>
      <div className={styles.overlay} onClick={handleClose} />
      <div className={`${styles.sheet} ${isClosing ? styles.sheetClosing : ""}`}>
        <div className={styles.glow1} />
        <div className={styles.glow2} />

        {/* Header */}
        <div className={styles.header}>
          <h2 className={`${styles.title} ${isHe ? styles.titleHe : ""}`}>{t.settingsTitle}</h2>
          <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>

          {/* ── Preferences ───────────────────────────────────────────── */}
          <section className={styles.section}>
            <p className={sectionLabelClass}>{t.settingsPreferences}</p>
            <div className={styles.rowGroup}>
              <ValueRow
                icon={<AlarmIcon size={18} color="#fff" />}
                label={t.settingsDreamReminder}
                value="07:30"
              />
              <ValueRow
                icon={<LanguageAIcon size={18} color="#fff" />}
                label={t.settingsLanguage}
                value={lang === "he" ? "עברית" : "English"}
                dropdownOptions={langOptions}
                selectedValue={lang}
                onSelectOption={(v) => { if (v !== lang) toggleLang(); }}
              />
              <ValueRow
                icon={<CrescentMoonIcon size={18} color="#fff" />}
                label={t.settingsMode}
                value={theme === "dark" ? t.settingsDark : t.settingsLight}
                dropdownOptions={modeOptions}
                selectedValue={theme}
                onSelectOption={(v) => { if (v !== theme) toggleTheme(); }}
              />
              <ValueRow
                icon={<DocumentIcon size={18} color="#fff" />}
                label={t.settingsInterpLength}
                value={interpLabel}
                dropdownOptions={interpOptions}
                selectedValue={interpLength}
                onSelectOption={(v) => setInterpLength(v as InterpLength)}
              />
              <ToggleRow
                icon={<SaveIcon size={18} color="#fff" />}
                label={t.settingsSaveLib}
                checked={showBorder}
                onChange={toggleBorder}
              />
            </div>
          </section>

          {/* ── Privacy ───────────────────────────────────────────────── */}
          <section className={styles.section}>
            <p className={sectionLabelClass}>{t.settingsPrivacy}</p>
            <div className={styles.rowGroup}>
              <ActionRow label={t.settingsExport} flip={isHe} />
              <ActionRow label={t.settingsDelete} flip={isHe} />
            </div>
          </section>

          {/* ── Support ───────────────────────────────────────────────── */}
          <section className={styles.section}>
            <p className={sectionLabelClass}>{t.settingsSupport}</p>
            <div className={styles.rowGroup}>
              <ActionRow label={t.settingsHelp} flip={isHe} />
              <ActionRow label={t.settingsContact} flip={isHe} />
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
