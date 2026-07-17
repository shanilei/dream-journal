import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Lists the voices available on this ElevenLabs account (premade +
// anything cloned/designed, e.g. a custom Hebrew voice) so Settings can
// offer a real picker instead of a hardcoded list.
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ voices: [] });
  }

  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
    // Voices change rarely; avoid re-fetching on every Settings open.
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return NextResponse.json({ voices: [] });
  }

  const data = await res.json().catch(() => null);
  const allVoices = Array.isArray(data?.voices) ? data.voices : [];

  // Only the voices actually added to this account (cloned/generated/
  // professional), not ElevenLabs' 20+ default library voices — the
  // in-app picker is for choosing between voices the user picked, not
  // browsing the whole catalog.
  const voices = allVoices
    .filter((v: { category?: string }) => v.category && v.category !== "premade")
    .map((v: { voice_id: string; name: string; category?: string }) => ({
      id: v.voice_id,
      name: v.name,
      category: v.category,
    }));

  return NextResponse.json({ voices });
}
