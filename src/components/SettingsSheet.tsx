"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import styles from "./SettingsSheet.module.css";
import { useLanguage } from "./LanguageProvider";
import { usePhotoBorder } from "./PhotoBorderProvider";
import { clearOnboarded } from "@/lib/onboarding";
import { loadSelectedVoiceId, saveSelectedVoiceId } from "@/lib/voicePreference";
import { createClient } from "@/lib/supabase/client";
import {
  AlarmIcon,
  LanguageAIcon,
  DocumentIcon,
  SaveIcon,
  ChevronRightIcon,
  UpDownChevronIcon,
  CheckmarkIcon,
  VolumeIcon,
  PlayIcon,
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
  onPreview,
  previewStatus = "idle",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
  dropdownOptions?: DropdownOption[];
  selectedValue?: string;
  onSelectOption?: (value: string) => void;
  /** Optional small play button before the value/chevron — e.g. previewing
      the currently selected voice without opening the dropdown. */
  onPreview?: () => void;
  previewStatus?: "idle" | "loading" | "playing" | "error";
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
          {onPreview && (
            <span
              role="button"
              tabIndex={0}
              className={`${styles.rowPreviewBtn} ${previewStatus === "error" ? styles.rowPreviewBtnError : ""}`}
              aria-label="Preview voice"
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); onPreview(); }
              }}
            >
              {previewStatus === "loading" ? (
                <span className={styles.rowPreviewSpinner} />
              ) : previewStatus === "error" ? (
                <span className={styles.rowPreviewErrorMark}>!</span>
              ) : (
                <PlayIcon size={12} color="rgba(255,255,255,0.7)" />
              )}
            </span>
          )}
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

function ActionRow({ label, flip, onClick }: { label: string; flip?: boolean; onClick?: () => void }) {
  return (
    <button type="button" className={styles.row} onClick={onClick}>
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
  const { lang, t, toggleLang } = useLanguage();
  const { showBorder, toggleBorder } = usePhotoBorder();
  const [isClosing, setIsClosing] = useState(false);
  const [interpLength, setInterpLength] = useState<InterpLength>("long");
  const [voices, setVoices] = useState<{ id: string; name: string; previewUrl?: string }[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const isHe = lang === "he";

  // Only the voices actually added to the ElevenLabs account show up
  // here (see /api/voices) — not the full default library. Defaults to
  // whichever was picked last time; if nothing's been picked yet, or the
  // saved id no longer exists in this account's list (deleted/renamed in
  // ElevenLabs since it was picked), falls back to the first voice.
  useEffect(() => {
    const saved = loadSelectedVoiceId();
    setSelectedVoiceId(saved);
    fetch("/api/voices")
      .then((res) => res.json())
      .then((data: { voices?: { id: string; name: string; previewUrl?: string }[] }) => {
        const list = data.voices ?? [];
        setVoices(list);
        setSelectedVoiceId((current) => {
          const stillValid = current && list.some((v) => v.id === current);
          if (stillValid) return current;
          const fallback = list[0]?.id ?? null;
          if (fallback) saveSelectedVoiceId(fallback);
          return fallback;
        });
      })
      .catch(() => {});
  }, []);

  function handleSelectVoice(voiceId: string) {
    setSelectedVoiceId(voiceId);
    saveSelectedVoiceId(voiceId);
  }

  const PREVIEW_SENTENCE = "Your dream is ready to be heard.";

  // Narration is English-only for now (see the hidden listening button on
  // dream results in Hebrew) — no point offering a voice picker for a
  // feature that isn't available in the current language.
  async function handlePreviewVoice() {
    if (previewStatus === "loading") return;

    // Stop whatever preview (if any) is already playing before starting
    // the next one — never two previews overlapping.
    previewAudioRef.current?.pause();

    if (!previewAudioRef.current) previewAudioRef.current = new Audio();
    const audio = previewAudioRef.current;
    // Same iOS Safari unlock as the main Listen button — see
    // DreamResultScreen.tsx's handleListen for why this call, which
    // immediately fails since there's no source yet, still matters.
    audio.play().catch(() => {});
    audio.pause();

    const voice = voices.find((v) => v.id === selectedVoiceId);
    console.log("[voice-preview] start", { voiceId: selectedVoiceId, hasPreviewUrl: !!voice?.previewUrl });
    setPreviewStatus("loading");
    try {
      let src = voice?.previewUrl;
      if (!src) {
        // No preview_url on this voice — generate a short one through the
        // same TTS route instead of failing silently.
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: PREVIEW_SENTENCE, voiceId: selectedVoiceId }),
        });
        if (!res.ok) throw new Error(`tts fallback failed: ${res.status}`);
        const blob = await res.blob();
        if (blob.size === 0) throw new Error("tts fallback returned empty audio");
        src = URL.createObjectURL(blob);
      }
      audio.src = src;
      audio.onended = () => setPreviewStatus("idle");
      await audio.play();
      setPreviewStatus("playing");
    } catch (err) {
      console.error("[voice-preview] error", (err as Error)?.message);
      setPreviewStatus("error");
      setTimeout(() => setPreviewStatus((s) => (s === "error" ? "idle" : s)), 2000);
    }
  }

  useEffect(() => {
    return () => { previewAudioRef.current?.pause(); };
  }, []);

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

  const voiceOptions: DropdownOption[] = voices.map((v) => ({ value: v.id, label: v.name }));
  const voiceLabel = voices.find((v) => v.id === selectedVoiceId)?.name ?? "";

  const sectionLabelClass = isHe
    ? `${styles.sectionLabelLarge} ${styles.sectionLabelHe}`
    : styles.sectionLabelLarge;

  return (
    <>
      <div className={styles.overlay} onClick={handleClose} />
      <div className={`${styles.sheet} ${isClosing ? styles.sheetClosing : ""}`}>
        <div className={styles.glow1} />
        <div className={styles.glow2} />
        <div className={styles.glow3} />
        <div className={styles.grain} />

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
                icon={<DocumentIcon size={18} color="#fff" />}
                label={t.settingsInterpLength}
                value={interpLabel}
                dropdownOptions={interpOptions}
                selectedValue={interpLength}
                onSelectOption={(v) => setInterpLength(v as InterpLength)}
              />
              {/* English-only: narration doesn't work correctly in Hebrew
                  yet (see the hidden listening button on dream results). */}
              {!isHe && voices.length > 0 && (
                <ValueRow
                  icon={<VolumeIcon size={18} color="#fff" />}
                  label={t.settingsVoice}
                  value={voiceLabel}
                  dropdownOptions={voiceOptions}
                  selectedValue={selectedVoiceId ?? ""}
                  onSelectOption={handleSelectVoice}
                  onPreview={selectedVoiceId ? handlePreviewVoice : undefined}
                  previewStatus={previewStatus}
                />
              )}
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

          {/* ── Account ───────────────────────────────────────────────────
              Sign-out only, for now — nothing in the app is gated behind
              a session yet (Phase 2 is authentication only), so this row
              is harmless to show/tap regardless of whether the visitor
              actually has a session; signOut() on a signed-out browser
              client is a safe no-op. */}
          <section className={styles.section}>
            <p className={sectionLabelClass}>{t.settingsAccount}</p>
            <div className={styles.rowGroup}>
              <ActionRow
                label={t.signOut}
                flip={isHe}
                onClick={async () => {
                  await createClient().auth.signOut();
                  window.location.href = "/signin";
                }}
              />
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

          {/* ── Developer (QA only) ──────────────────────────────────────
              Not user-facing copy, so no translation keys — hidden outside
              non-production builds so real users never see it. */}
          {process.env.NODE_ENV !== "production" && (
            <section className={styles.section}>
              <p className={sectionLabelClass}>Developer</p>
              <div className={styles.rowGroup}>
                <ActionRow
                  label="Reset onboarding"
                  flip={isHe}
                  onClick={() => {
                    clearOnboarded();
                    window.location.href = "/";
                  }}
                />
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  );
}
