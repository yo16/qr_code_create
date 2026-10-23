"use client";

import Link from "next/link";
import { trackCtaClicked } from "@/lib/analytics/events";
import styles from "./ArticleCta.module.css";

interface ArticleCtaProps {
  href?: string;
  text?: string;
  location?: string;
}

export function ArticleCta({
  href = "/create",
  text = "QRコードを作成する",
  location = "article_bottom",
}: ArticleCtaProps) {
  return (
    <aside className={styles.cta} aria-label="QRコード作成への案内">
      <p className={styles.heading}>このページの内容でQRコードを作ってみましょう</p>
      <Link href={href} className={styles.button} onClick={() => trackCtaClicked(text, location)}>
        {text}
      </Link>
      <p className={styles.note}>無料・登録不要</p>
    </aside>
  );
}
