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
  return (
    <div
      className={`${styles.glass} ${fill ? styles.fill : ""} ${className || ""}`}
      style={fill ? undefined : { width: size, height: size }}
    />
  );
}
