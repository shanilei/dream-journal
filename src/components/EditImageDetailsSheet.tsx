"use client";

import { useState } from "react";
import styles from "./EditImageDetailsSheet.module.css";
import { useLanguage } from "./LanguageProvider";
import { CAPTION_MAX_CHARS } from "@/lib/caption";
import { CloseIcon } from "./Icons";

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

export default function EditImageDetailsSheet({
  caption,
  onCaptionChange,
  dateValue,
  onDateChange,
  timeValue,
  onTimeChange,
  showDate,
  onShowDateChange,
  showTime,
  onShowTimeChange,
  saving = false,
  onSave,
  onCancel,
}: {
  caption: string;
  onCaptionChange: (value: string) => void;
  dateValue: string;
  onDateChange: (value: string) => void;
  timeValue: string;
  onTimeChange: (value: string) => void;
  showDate: boolean;
  onShowDateChange: (value: boolean) => void;
  showTime: boolean;
  onShowTimeChange: (value: boolean) => void;
  saving?: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { t, lang } = useLanguage();
  const isHe = lang === "he";
  const [isClosing, setIsClosing] = useState(false);

  function handleCancel() {
    setIsClosing(true);
    setTimeout(onCancel, 280);
  }

  return (
    <>
      <div className={styles.overlay} onClick={handleCancel} />
      <div className={`${styles.sheet} ${isClosing ? styles.sheetClosing : ""}`}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={`${styles.title} ${isHe ? styles.titleHe : ""}`}>{t.editDetailsTitle}</h2>
            <p className={`${styles.subtitle} ${isHe ? styles.subtitleHe : ""}`}>{t.editDetailsSubtitle}</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={handleCancel} aria-label={t.cancel}>
            <CloseIcon size={14} color="#fff" />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.field}>
            <label className={`${styles.fieldLabel} ${isHe ? styles.fieldLabelHe : ""}`} htmlFor="edit-image-caption">
              {t.captionFieldLabel}
            </label>
            <textarea
              id="edit-image-caption"
              className={`${styles.textarea} ${isHe ? styles.textareaHe : ""}`}
              value={caption}
              maxLength={CAPTION_MAX_CHARS}
              rows={3}
              onChange={(e) => onCaptionChange(e.target.value)}
            />
            <div className={styles.counter}>
              {caption.length}/{CAPTION_MAX_CHARS}
            </div>
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={`${styles.fieldLabel} ${isHe ? styles.fieldLabelHe : ""}`} htmlFor="edit-image-date">
                {t.dateFieldLabel}
              </label>
              <input
                id="edit-image-date"
                type="date"
                className={styles.input}
                value={dateValue}
                onChange={(e) => onDateChange(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={`${styles.fieldLabel} ${isHe ? styles.fieldLabelHe : ""}`} htmlFor="edit-image-time">
                {t.timeFieldLabel}
              </label>
              <input
                id="edit-image-time"
                type="time"
                className={styles.input}
                value={timeValue}
                onChange={(e) => onTimeChange(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.toggleRow}>
            <span className={`${styles.toggleLabel} ${isHe ? styles.toggleLabelHe : ""}`}>{t.showDateLabel}</span>
            <Toggle checked={showDate} onChange={onShowDateChange} label={t.showDateLabel} />
          </div>
          <div className={styles.toggleRow}>
            <span className={`${styles.toggleLabel} ${isHe ? styles.toggleLabelHe : ""}`}>{t.showTimeLabel}</span>
            <Toggle checked={showTime} onChange={onShowTimeChange} label={t.showTimeLabel} />
          </div>

          <div className={styles.actions}>
            <button type="button" className={`${styles.cancelBtn} ${isHe ? styles.btnHe : ""}`} onClick={handleCancel}>
              {t.cancel}
            </button>
            <button
              type="button"
              className={`${styles.saveBtn} ${isHe ? styles.btnHe : ""}`}
              onClick={onSave}
              disabled={saving}
            >
              {t.saveChanges}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
