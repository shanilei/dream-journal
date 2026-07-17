"use client";

const VOICE_ID_KEY = "dream-journal-voice-id";

export function loadSelectedVoiceId(): string | null {
  try {
    return localStorage.getItem(VOICE_ID_KEY);
  } catch {
    return null;
  }
}

export function saveSelectedVoiceId(voiceId: string) {
  try {
    localStorage.setItem(VOICE_ID_KEY, voiceId);
  } catch {
    // ignore — worst case the default voice is used next time
  }
}
