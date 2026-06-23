import styles from "./GlassEffect.module.css";

export default function GlassEffect({
  size = 184,
  fill = false,
  className,
}: {
  size?: number;
  fill?: boolean;
  className?: string;
}) {
  const scale = size / 184;

  return (
    <div
      className={`${styles.glass} ${fill ? styles.fill : ""} ${className || ""}`}
      style={
        {
          ...(fill ? {} : { width: size, height: size }),
          "--glass-scale": scale,
        } as React.CSSProperties
      }
    >
      <div className={styles.baseBlur} />
      <div className={styles.maskedBlur} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.highlight} src="/images/glass/glass-highlight.svg" alt="" />
      <div className={styles.rim} />
    </div>
  );
}
