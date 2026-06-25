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
      <div className={styles.tintLayer} />
      <div className={styles.plusLighterLayer} />
      <div className={styles.luminosityLayer} />
      <div className={styles.sheenLayer} />
    </div>
  );
}
