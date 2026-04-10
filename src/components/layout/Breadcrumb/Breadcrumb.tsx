import Link from "next/link";
import styles from "./Breadcrumb.module.css";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className={styles.breadcrumb} aria-label="パンくずリスト">
      <ol className={styles.list}>
        <li className={styles.item}>
          <Link href="/">ホーム</Link>
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
