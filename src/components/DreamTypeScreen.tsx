"use client";

import { useRef } from "react";
import Link from "next/link";
import styles from "./DreamTypeScreen.module.css";
import { ArrowLeftIcon, ArrowUpIcon } from "./Icons";
import { useLanguage } from "./LanguageProvider";

type Status = "typing" | "error";

export default function DreamTypeScreen({
  value,
  onChange,
  onSubmit,
  status,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  status: Status;
}) {
  const { t } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) onSubmit();
  }

  return (
    <div className={styles.screen}>
      <Link href="/record" className={styles.backButton} aria-label="Back">
        <span className={styles.backIcon}>
          <ArrowLeftIcon size={20} color="currentColor" />
        </span>
      </Link>

      {status === "error" && (
        <p className={styles.errorText}>Something went wrong — try again.</p>
      )}

      <form className={styles.inputPill} onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder={t.dreamInputPlaceholder}
          rows={1}
          value={value}
          onChange={handleInput}
          autoFocus
        />
        <button
          type="submit"
          className={styles.submitButton}
          aria-label="Analyze dream"
          disabled={!value.trim()}
        >
          <ArrowUpIcon size={18} color="currentColor" />
        </button>
      </form>
    </div>
  );
}
