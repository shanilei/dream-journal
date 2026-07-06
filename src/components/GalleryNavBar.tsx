import styles from "./GalleryNavBar.module.css";
import { UserIcon, CalendarIcon, MicIcon, ActivityIcon } from "./Icons";

export default function GalleryNavBar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.pill}>
        <button type="button" className={styles.item} aria-label="Contacts">
          <UserIcon size={22} color="#fff" />
        </button>
        <button type="button" className={styles.item} aria-label="Calendar">
          <CalendarIcon size={22} color="#fff" />
        </button>
        <button type="button" className={styles.item} aria-label="Voice">
          <MicIcon size={22} color="#fff" />
        </button>
        <button type="button" className={styles.item} aria-label="Activity">
          <ActivityIcon size={22} color="#fff" />
        </button>
      </div>
    </nav>
  );
}
