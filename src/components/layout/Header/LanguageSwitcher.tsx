"use client";

import { usePathname } from "next/navigation";
import { useDict, useLocale } from "@/i18n/useDict";
import { getAlternatePath } from "@/lib/i18n/routes";
import type { Locale } from "@/i18n/types";
import styles from "./Header.module.css";

/**
 * 言語切り替え。行き先は現在の言語の反対。ラベルは辞書（common.languageSwitch）から引く。
 * full reload になるので next/link は使わず a を使う。クエリと hash は引き継がない。
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const { label, hint } = useDict().common.languageSwitch;
  const pathname = usePathname() ?? "/";
  const to: Locale = locale === "ja" ? "en" : "ja";
  const href = getAlternatePath(pathname, to);

  return (
    <a href={href} hrefLang={to} lang={to} className={styles.langLink}>
      {label}
      <span lang="en" className={styles.srOnly}>
        {hint}
      </span>
    </a>
  );
}
