"use client";

import { useEffect, useRef } from "react";
import styles from "./VoiceRecordCircle.module.css";

type Props = {
  isRecording: boolean;
  onPermissionDenied?: () => void;
  onRecordingComplete?: (audio: Blob) => void;
  onTranscriptUpdate?: (text: string) => void;
};

export default function VoiceRecordCircle({ isRecording, onPermissionDenied, onRecordingComplete, onTranscriptUpdate }: Props) {
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<{ stop(): void } | null>(null);
  // Latest callbacks live in refs so the recording effect only ever depends
  // on isRecording — re-running it on every inline-callback re-render would
  // restart the in-progress recording.
  const onPermissionDeniedRef = useRef(onPermissionDenied);
  const onRecordingCompleteRef = useRef(onRecordingComplete);
  const onTranscriptUpdateRef = useRef(onTranscriptUpdate);

  useEffect(() => {
    onPermissionDeniedRef.current = onPermissionDenied;
  }, [onPermissionDenied]);

  useEffect(() => {
    onRecordingCompleteRef.current = onRecordingComplete;
  }, [onRecordingComplete]);

  useEffect(() => {
    onTranscriptUpdateRef.current = onTranscriptUpdate;
  }, [onTranscriptUpdate]);

  useEffect(() => {
    if (!isRecording) return;
    let cancelled = false;

    // Live transcript via Web Speech API (best-effort, not all browsers support it)
    type AnySpeechRecognition = {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: ((e: SpeechRecognitionEvent) => void) | null;
      onerror: (() => void) | null;
      start(): void;
      stop(): void;
    };
    type SpeechRecognitionCtor = new () => AnySpeechRecognition;

    const SpeechRecognitionCtor: SpeechRecognitionCtor | undefined =
      typeof window !== "undefined"
        ? ((window as unknown as Record<string, unknown>).SpeechRecognition ??
          (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as SpeechRecognitionCtor | undefined
        : undefined;

    if (SpeechRecognitionCtor) {
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "he-IL,en-US";

      let committed = "";
      recognition.onresult = (e: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) committed += t + " ";
          else interim = t;
        }
        onTranscriptUpdateRef.current?.((committed + interim).trim());
      };
      recognition.onerror = () => {};
      recognition.start();
      recognitionRef.current = recognition;
    }

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
      recognitionRef.current?.stop();
      recognitionRef.current = null;
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

  return null;
}
