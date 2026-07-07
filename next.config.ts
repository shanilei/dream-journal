import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@napi-rs/canvas"],
  devIndicators: false,
  // Vercel's file tracer doesn't reliably detect readFileSync(path.join(
  // process.cwd(), ...)) calls in src/print-image.ts as a dependency, so
  // the font files it needs (for the flattened print image) would be
  // missing from the deployed function bundle without this.
  outputFileTracingIncludes: {
    "/api/dream": ["./font/**"],
  },
};

export default nextConfig;
