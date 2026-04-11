import Link from "next/link";
import { Container } from "../Container/Container";
import { MobileNav } from "./MobileNav";
import styles from "./Header.module.css";

const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/guide", label: "使い方" },
  { href: "/use-cases", label: "用途別" },
  { href: "/blog", label: "ブログ" },
  { href: "/faq", label: "FAQ" },
];

export function Header() {
  return (
    <header className={styles.header}>
      <Container>
        <div className={styles.inner}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              QR Code Create
            </Link>
            <span className={styles.badge}>完全無料・登録不要</span>
          </div>
          <nav className={styles.desktopNav}>
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/create" className={styles.ctaLink}>
              QRコード生成
            </Link>
          </nav>
          <MobileNav items={NAV_ITEMS} />
        </div>
      </Container>
    </header>
  );
}
