"use client";

import Link from "next/link";
import { trackCtaClicked } from "@/lib/analytics/events";
import { useDict } from "@/i18n/useDict";
import styles from "./ArticleCta.module.css";

interface ArticleCtaProps {
  href?: string;
  text?: string;
  location?: string;
}

export function ArticleCta({
  href = "/create",
  text,
  location = "article_bottom",
}: ArticleCtaProps) {
  const copy = useDict().common.articleCta;
  const label = text ?? copy.defaultText;
  return (
    <aside className={styles.cta} aria-label={copy.ariaLabel}>
      <p className={styles.heading}>{copy.heading}</p>
      <Link href={href} className={styles.button} onClick={() => trackCtaClicked(label, location)}>
        {label}
      </Link>
      <p className={styles.note}>{copy.note}</p>
    </aside>
  );
}
