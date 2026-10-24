"use client";

import { useState } from "react";
import Link from "next/link";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { useDict, useLocale } from "@/i18n/useDict";
import { localePath } from "@/lib/i18n/routes";
import styles from "./MobileNav.module.css";

interface NavItem {
  href: string;
  label: string;
}

interface MobileNavProps {
  items: NavItem[];
}

export function MobileNav({ items }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { mobileMenu } = useDict().common;
  const locale = useLocale();

  return (
    <div className={styles.mobileNav}>
      <button
        className={styles.hamburger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? mobileMenu.close : mobileMenu.open}
        aria-expanded={isOpen}
      >
        <span className={`${styles.bar} ${isOpen ? styles.open : ""}`} />
        <span className={`${styles.bar} ${isOpen ? styles.open : ""}`} />
        <span className={`${styles.bar} ${isOpen ? styles.open : ""}`} />
      </button>
      {isOpen && (
        <nav className={styles.menu}>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.menuLink}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <TrackedLink
            href={localePath(locale, "/create")}
            className={styles.ctaLink}
            location="mobile_nav"
            onClick={() => setIsOpen(false)}
          >
            {mobileMenu.cta}
          </TrackedLink>
        </nav>
      )}
    </div>
  );
}
