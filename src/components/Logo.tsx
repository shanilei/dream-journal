function CrescentGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <mask id="crescent-mask">
        <rect width="100" height="100" fill="white" />
        <circle cx="64" cy="36" r="38" fill="black" />
      </mask>
      <circle cx="50" cy="50" r="42" fill="currentColor" mask="url(#crescent-mask)" />
    </svg>
  );
}

export default function Logo({
  lang,
  size = 48,
  color = "#fff",
}: {
  lang: "en" | "he";
  size?: number;
  color?: string;
}) {
  const glyphSize = size * 0.78;

  if (lang === "he") {
    // לוסיד, read right-to-left: ל [moon = ו] ס י ד
    return (
      <span
        dir="rtl"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: size * 0.04,
          fontSize: size,
          fontWeight: 700,
          color,
          lineHeight: 1,
        }}
      >
        <span>ל</span>
        <span style={{ display: "inline-flex", color }}>
          <CrescentGlyph size={glyphSize} />
        </span>
        <span>סיד</span>
      </span>
    );
  }

  // LUCID, left-to-right: L [moon = U] CID
  return (
    <span
      dir="ltr"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.04,
        fontSize: size,
        fontWeight: 700,
        color,
        lineHeight: 1,
        letterSpacing: "0.02em",
      }}
    >
      <span>L</span>
      <span style={{ display: "inline-flex", color }}>
        <CrescentGlyph size={glyphSize} />
      </span>
      <span>CID</span>
    </span>
  );
}
