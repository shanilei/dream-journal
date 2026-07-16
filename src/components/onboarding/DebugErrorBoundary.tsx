"use client";

import { Component, type ReactNode } from "react";

// TEMPORARY — added to capture a real iPhone /onboarding crash that
// couldn't be reproduced in Chromium. Safe to delete once the failure
// is captured; nothing else depends on it. Only wraps /onboarding's
// content (see page.tsx), not the rest of the app.
//
// Reports the same shape as the window.onerror/unhandledrejection
// listeners in page.tsx, plus React's own componentStack (which
// window.onerror alone can't give you) so we know exactly which
// component threw.
function report(payload: Record<string, unknown>) {
  const body = {
    ...payload,
    pathname: window.location.pathname,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
  console.error("[onboarding-debug]", body);
  fetch("/api/debug-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // best-effort — nothing to do if the report itself fails to send
  });
}

export default class DebugErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    report({
      source: "react-error-boundary",
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
