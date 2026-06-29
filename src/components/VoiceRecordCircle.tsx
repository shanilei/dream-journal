"use client";

import { useEffect, useRef } from "react";
import styles from "./VoiceRecordCircle.module.css";

type Props = {
  isRecording: boolean;
  onPermissionDenied?: () => void;
  onRecordingComplete?: (audio: Blob) => void;
};

export default function VoiceRecordCircle({ isRecording, onPermissionDenied, onRecordingComplete }: Props) {
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  // Latest callbacks live in refs so the recording effect only ever depends
  // on isRecording — re-running it on every inline-callback re-render would
  // restart the in-progress recording.
  const onPermissionDeniedRef = useRef(onPermissionDenied);
  const onRecordingCompleteRef = useRef(onRecordingComplete);

  useEffect(() => {
    onPermissionDeniedRef.current = onPermissionDenied;
  }, [onPermissionDenied]);

  useEffect(() => {
    onRecordingCompleteRef.current = onRecordingComplete;
  }, [onRecordingComplete]);

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

        const chunks: BlobPart[] = [];
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          const audio = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
          onRecordingCompleteRef.current?.(audio);
        };
        recorder.start();
        recorderRef.current = recorder;
      })
      .catch(() => {
        if (!cancelled) onPermissionDeniedRef.current?.();
      });

    return () => {
      cancelled = true;
      // .stop() flushes any remaining data and fires onstop (which reports
      // the finished recording back to the caller) before the tracks die.
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recorderRef.current = null;
    };
  }, [isRecording]);

  return <div className={isRecording ? `${styles.circle} ${styles.recording}` : styles.circle} />;
}
