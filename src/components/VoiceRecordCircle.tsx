"use client";

import { useEffect, useRef } from "react";
import styles from "./VoiceRecordCircle.module.css";

type Props = {
  isRecording: boolean;
  onPermissionDenied?: () => void;
};

export default function VoiceRecordCircle({ isRecording, onPermissionDenied }: Props) {
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isRecording) return;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
      })
      .catch(() => {
        if (!cancelled) onPermissionDenied?.();
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [isRecording, onPermissionDenied]);

  return (
    <div className={styles.clip}>
      <div className={isRecording ? `${styles.circle} ${styles.recording}` : styles.circle} />
    </div>
  );
}
