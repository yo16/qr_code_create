import Link from "next/link";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Container } from "../Container/Container";
import { BrandMark } from "./BrandMark";
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
              <BrandMark className={styles.mark} />
              QR Code Create
            </Link>
          </div>
          <nav className={styles.desktopNav}>
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ))}
            <TrackedLink href="/create" className={styles.ctaLink} location="header">
              QRコード生成
            </TrackedLink>
          </nav>
          <MobileNav items={NAV_ITEMS} />
        </div>
      </Container>
    </header>
  );
}
