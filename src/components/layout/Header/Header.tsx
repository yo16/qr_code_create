import Link from "next/link";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { getDict } from "@/i18n/getDict";
import type { Locale } from "@/i18n/types";
import { hasEnVersion, localePath } from "@/lib/i18n/routes";
import { Container } from "../Container/Container";
import { BrandMark } from "./BrandMark";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNav } from "./MobileNav";
import styles from "./Header.module.css";

interface HeaderProps {
  locale?: Locale;
}

export function Header({ locale = "ja" }: HeaderProps = {}) {
  const { header } = getDict(locale);
  // en は英語版があるページだけ（Home と、英語ガイドができたら Getting started）
  const navItems =
    locale === "en"
      ? [
          { href: localePath(locale, "/"), label: header.nav.home },
          ...(hasEnVersion("/guide/getting-started")
            ? [
                {
                  href: localePath(locale, "/guide/getting-started"),
                  label: header.nav.guide,
                },
              ]
            : []),
        ]
      : [
          { href: "/", label: header.nav.home },
          { href: "/guide", label: header.nav.guide },
          { href: "/use-cases", label: header.nav.useCases },
          { href: "/blog", label: header.nav.blog },
          { href: "/faq", label: header.nav.faq },
        ];

  return (
    <header className={styles.header}>
      <Container>
        <div className={styles.inner}>
          <div className={styles.brand}>
            <Link href={localePath(locale, "/")} className={styles.logo}>
              <BrandMark className={styles.mark} />
              QR Code Create
            </Link>
          </div>
          <div className={styles.actions}>
            <nav className={styles.desktopNav}>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={styles.navLink}>
                  {item.label}
                </Link>
              ))}
              <TrackedLink href={localePath(locale, "/create")} className={styles.ctaLink} location="header">
                {header.cta}
              </TrackedLink>
            </nav>
            <LanguageSwitcher />
            <MobileNav items={navItems} />
          </div>
        </div>
      </Container>
    </header>
  );
}
