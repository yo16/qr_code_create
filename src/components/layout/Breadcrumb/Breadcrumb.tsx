import Link from "next/link";
import { getDict } from "@/i18n/getDict";
import type { Locale } from "@/i18n/types";
import styles from "./Breadcrumb.module.css";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  locale?: Locale;
}

export function Breadcrumb({ items, locale = "ja" }: BreadcrumbProps) {
  const { breadcrumb } = getDict(locale).guide;
  return (
    <nav className={styles.breadcrumb} aria-label={breadcrumb.ariaLabel}>
      <ol className={styles.list}>
        <li className={styles.item}>
          <Link href="/">{breadcrumb.home}</Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className={styles.item}>
            <span className={styles.separator} aria-hidden="true">
              &gt;
            </span>
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
