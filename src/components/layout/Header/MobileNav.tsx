"use client";

import { useState } from "react";
import Link from "next/link";
import { TrackedLink } from "@/components/analytics/TrackedLink";
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

  return (
    <div className={styles.mobileNav}>
      <button
        className={styles.hamburger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
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
            href="/create"
            className={styles.ctaLink}
            location="mobile_nav"
            onClick={() => setIsOpen(false)}
          >
            QRコード生成
          </TrackedLink>
        </nav>
      )}
    </div>
  );
}
