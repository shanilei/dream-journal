"use client";

import { useEffect, useRef } from "react";
import styles from "./VoiceRecordCircle.module.css";

type Props = {
  isRecording: boolean;
  isPaused?: boolean;
  /* Bump this to discard the in-progress recording and start capturing a
     fresh one — the effect below tears down and re-runs, which naturally
     resets its local `chunks` array. */
  restartToken?: number;
  onPermissionDenied?: () => void;
  onRecordingComplete?: (audio: Blob) => void;
  onTranscriptUpdate?: (text: string) => void;
  /* Live per-bar volume levels (0-1, one per bar) sampled from the actual
     microphone input via Web Audio's AnalyserNode — for driving a
     waveform visualization that genuinely reacts to sound rather than
     just looping a canned animation. */
  onAudioLevels?: (levels: number[]) => void;
  audioBarCount?: number;
};

export default function VoiceRecordCircle({ isRecording, isPaused = false, restartToken = 0, onPermissionDenied, onRecordingComplete, onTranscriptUpdate, onAudioLevels, audioBarCount = 5 }: Props) {
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<{ stop(): void } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRafRef = useRef<number | null>(null);
  // Latest callbacks live in refs so the recording effect only ever depends
  // on isRecording — re-running it on every inline-callback re-render would
  // restart the in-progress recording.
  const onPermissionDeniedRef = useRef(onPermissionDenied);
  const onRecordingCompleteRef = useRef(onRecordingComplete);
  const onTranscriptUpdateRef = useRef(onTranscriptUpdate);
  const onAudioLevelsRef = useRef(onAudioLevels);
  const isPausedRef = useRef(isPaused);

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
    onAudioLevelsRef.current = onAudioLevels;
  }, [onAudioLevels]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (isPaused && recorder.state === "recording") {
      recorder.pause();
      recognitionRef.current?.stop();
    } else if (!isPaused && recorder.state === "paused") {
      recorder.resume();
    }
  }, [isPaused]);

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

        // Real audio-reactive levels: an AnalyserNode tapped off the same
        // mic stream (not connected to destination — analysis only,
        // doesn't play the mic back). Frequency bins are bucketed into
        // `audioBarCount` groups so each bar reflects a different slice
        // of the spectrum instead of all bars moving in lockstep.
        if (onAudioLevelsRef.current) {
          try {
            const AudioContextCtor =
              window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const audioCtx = new AudioContextCtor();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.6;
            source.connect(analyser);
            audioCtxRef.current = audioCtx;

            const freqData = new Uint8Array(analyser.frequencyBinCount);
            const barCount = audioBarCount;
            const binsPerBar = Math.max(1, Math.floor(freqData.length / barCount));

            const tick = () => {
              analyser.getByteFrequencyData(freqData);
              if (!isPausedRef.current) {
                const levels: number[] = [];
                for (let i = 0; i < barCount; i++) {
                  let sum = 0;
                  for (let j = i * binsPerBar; j < (i + 1) * binsPerBar; j++) sum += freqData[j] ?? 0;
                  levels.push(Math.min(1, sum / binsPerBar / 255));
                }
                onAudioLevelsRef.current?.(levels);
              }
              analyserRafRef.current = requestAnimationFrame(tick);
            };
            analyserRafRef.current = requestAnimationFrame(tick);
          } catch {
            // Web Audio unavailable — waveform just won't animate, recording still works.
          }
        }
      })
      .catch(() => {
        if (!cancelled) onPermissionDeniedRef.current?.();
      });

    return () => {
      cancelled = true;
      if (analyserRafRef.current) cancelAnimationFrame(analyserRafRef.current);
      analyserRafRef.current = null;
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
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
  }, [isRecording, restartToken]);

  return null;
}
