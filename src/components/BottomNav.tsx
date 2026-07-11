import Link from "next/link";
import styles from "./BottomNav.module.css";
import { AddAIIcon, CalendarIcon, UserIcon } from "./Icons";

type NavKey = "record" | "user" | "dreams";

export default function BottomNav({
  active,
  hidden = false,
}: {
  active: NavKey;
  hidden?: boolean;
}) {
  const items: { key: NavKey; href: string; icon: (color: string) => React.ReactNode }[] = [
    { key: "user", href: "/user", icon: (c) => <UserIcon color={c} size={22} /> },
    { key: "record", href: "/record", icon: (c) => <AddAIIcon color={c} size={26} /> },
    { key: "dreams", href: "/gallery", icon: (c) => <CalendarIcon color={c} size={22} /> },
  ];

  return (
    <nav className={`${styles.nav} ${hidden ? styles.navHidden : ""}`} aria-hidden={hidden} inert={hidden || undefined}>
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`${styles.circle} ${isActive ? styles.active : ""}`}
          >
            <span className={styles.iconLayer}>{item.icon(isActive ? "#000624" : "#fff")}</span>
          </Link>
        );
      })}
    </nav>
  );
}
