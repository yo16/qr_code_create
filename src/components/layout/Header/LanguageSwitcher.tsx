"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useDict, useLocale } from "@/i18n/useDict";
import { LOCALES } from "@/i18n/locales";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";
import { getAlternatePath } from "@/lib/i18n/routes";
import styles from "./Header.module.css";

/**
 * 言語切り替え（disclosure）。ボタンで言語の一覧を開閉し、一覧の各リンクで別の言語へ移る。
 * 設計: doc/design/i18n-multi.md 8 節。role="menu" は使わず、Tab で順に進む。
 * 言語名は LOCALE_CONFIG から取る（他言語の辞書は持ち込まない）。
 * full reload になるので next/link は使わず a を使う。クエリと hash は引き継がない。
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const { buttonLabel, listLabel } = useDict().common.languageSwitch;
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const current = LOCALE_CONFIG[locale];

  // 外側のクリックで閉じる
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div
      className={styles.langSwitch}
      ref={rootRef}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
      onBlur={(e) => {
        // フォーカスが部品の外へ出たら閉じる
        const next = e.relatedTarget as Node | null;
        if (next && !rootRef.current?.contains(next)) setOpen(false);
      }}
    >
      <button
        type="button"
        ref={buttonRef}
        className={styles.langButton}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.srOnly}>{buttonLabel}: </span>
        <span lang={current.htmlLang}>{current.shortName}</span>
        <span aria-hidden="true" className={styles.chevron} />
      </button>
      <ul id={listId} aria-label={listLabel} hidden={!open} className={styles.langList}>
        {LOCALES.map((l) => (
          <li key={l}>
            <a
              href={getAlternatePath(pathname, l)}
              hrefLang={LOCALE_CONFIG[l].htmlLang}
              lang={LOCALE_CONFIG[l].htmlLang}
              aria-current={l === locale ? "true" : undefined}
              className={styles.langItem}
            >
              {LOCALE_CONFIG[l].nativeName}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
