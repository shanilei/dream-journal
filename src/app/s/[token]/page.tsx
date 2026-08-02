import { notFound } from "next/navigation";
import { getSharedDream } from "@/dream-shares";
import { translateMood, formatDreamDate, langFromText } from "@/i18n/translations";
import { effectiveDreamDate } from "@/lib/dreamDate";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

// Public, unauthenticated, read-only — reachable by anyone who scans the
// QR code shown on the Exhibition Mode result screen (see
// DreamResultScreen.tsx). getSharedDream() only ever returns the
// public-safe field subset (see its own comment in dream-shares.ts): no
// user_id, no email, no way to reach any other dream from here.
export default async function SharedDreamPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dream = await getSharedDream(token);
  if (!dream) notFound();

  // No signed-in viewer here to carry a language preference — falls back
  // to whatever the dream's own text is written in, same heuristic the
  // rest of the app uses to pick a per-dream direction/locale.
  const lang = langFromText(dream.summaryText, "en");
  const dateIso = effectiveDreamDate({ createdAt: dream.createdAt, displayAt: dream.displayAt });
  const title = dream.name || translateMood(dream.mood, lang);
  const interpretation = dream.interpretationText || dream.summaryText;

  return (
    <main className={styles.page} lang={lang} dir={lang === "he" ? "rtl" : "ltr"}>
      <div className={styles.card}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dream.imageUrl} alt="" className={styles.image} />
        <div className={styles.body}>
          <span className={styles.tag} dir="auto">{translateMood(dream.mood, lang)}</span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.date}>{formatDreamDate(dateIso, lang)}</p>
          {interpretation && <p className={styles.interpretation}>{interpretation}</p>}
          <a
            className={styles.saveButton}
            href={`/api/s/${token}/download`}
            download
          >
            {lang === "he" ? "שמור תמונה" : "Save image"}
          </a>
        </div>
      </div>
    </main>
  );
}
