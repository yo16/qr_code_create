import Link from "next/link";
import { getDict } from "@/i18n/getDict";
import type { Locale } from "@/i18n/types";
import styles from "./ComingSoonPage.module.css";

interface ComingSoonPageProps {
  title: string;
  description: string;
  locale?: Locale;
}

export function ComingSoonPage({ title, description, locale = "ja" }: ComingSoonPageProps) {
  const { comingSoon } = getDict(locale).common;
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden="true">🚧</div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.badge}>{comingSoon.badge}</p>
        <p className={styles.description}>{description}</p>
        <p className={styles.note}>
          {comingSoon.noteLine1}
          <br />
          {comingSoon.noteLine2}
        </p>
        <div className={styles.actions}>
          <Link href="/create" className={styles.primaryButton}>
            {comingSoon.create}
          </Link>
          <Link href="/" className={styles.secondaryButton}>
            {comingSoon.backToTop}
          </Link>
        </div>
      </div>
    </main>
  );
}
