import { NextResponse } from "next/server";

// TEMPORARY — added to capture a real iPhone /onboarding crash that
// couldn't be reproduced in Chromium. Safe to delete this whole file
// once the failure is captured; nothing else depends on it.
//
// Just logs to the server console — Vercel's own request/function logs
// already tag every line with the deploymentId, so no extra plumbing is
// needed to know which build produced a given report.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  console.error("[onboarding-debug]", JSON.stringify(body));
  return NextResponse.json({ ok: true });
}
