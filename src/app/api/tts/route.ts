import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// ElevenLabs' "Rachel" — a calm, neutral premade voice, used unless
// ELEVENLABS_VOICE_ID overrides it.
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }

  const body = await req.json().catch(() => null);
  const text = body?.text;
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "missing_text" }, { status: 400 });
  }

  // Per-request override (the Settings voice picker) takes priority over
  // the env-level default.
  const requestedVoiceId = typeof body?.voiceId === "string" && body.voiceId.trim() ? body.voiceId : null;
  const voiceId = requestedVoiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("ElevenLabs TTS failed:", res.status, errText);
    return NextResponse.json({ error: "tts_failed" }, { status: 502 });
  }

  const audioBuffer = await res.arrayBuffer();
  return new NextResponse(audioBuffer, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
