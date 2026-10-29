import { LOCALES, NON_JA_LOCALES, type Locale } from "@/i18n/locales";
import { LOCALE_CONFIG } from "./localeConfig";

/**
 * 英語版があるページ（ja 側のパスで持つ）。互換のため残す。
 * 新しい呼び出しは hasVersion(locale, path) を使う。
 */
export const EN_AVAILABLE_PATHS: readonly string[] = LOCALE_CONFIG.en.paths;

/** ja 側のパスに locale 版があるか。ja は全ページがある */
export function hasVersion(locale: Locale, jaPath: string): boolean {
  const paths: "all" | readonly string[] = LOCALE_CONFIG[locale].paths;
  return paths === "all" || paths.includes(jaPath);
}

/** ja 側のパスに英語版があるか（hasVersion("en", path) と同じ） */
export function hasEnVersion(path: string): boolean {
  return hasVersion("en", path);
}

/**
 * ロケールに応じたパスを返す。
 * ja は日本語版のパスそのまま、ほかは接頭辞を前置する（`/` は接頭辞だけ）。
 */
export function localePath(locale: Locale, path: string): string {
  const { prefix } = LOCALE_CONFIG[locale];
  if (prefix === "") return path;
  if (path === "/" || path === "") return prefix;
  return `${prefix}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * パスの先頭の言語接頭辞を外す。接頭辞はセグメント単位で判定する
 * （`/en` と `/en/...` は en、`/engine` は ja の `/engine`）。
 */
export function splitLocale(pathname: string): { locale: Locale; jaPath: string } {
  for (const locale of NON_JA_LOCALES) {
    const { prefix } = LOCALE_CONFIG[locale];
    if (pathname === prefix) return { locale, jaPath: "/" };
    if (pathname.startsWith(`${prefix}/`)) {
      return { locale, jaPath: pathname.slice(prefix.length) };
    }
  }
  return { locale: LOCALES[0], jaPath: pathname };
}

/**
 * 現在のパスに対応する、相手言語のパスを返す（言語切り替え用）。
 * 対応ページが無ければ相手言語のトップ。末尾スラッシュは除いて判定する。
 * どの言語の接頭辞配下のパスも来うる: global-not-found が ja のシェルで接頭辞配下の未定義 URL を描くため、
 * 接頭辞を外した ja 側のパスとして判定し、自分自身を指さないようにする。
 */
export function getAlternatePath(pathname: string, to: Locale): string {
  let p = pathname.split(/[?#]/)[0] || "/";
  if (p.length > 1) p = p.replace(/\/+$/, "") || "/";
  const { locale: from, jaPath } = splitLocale(p);
  if (to !== "ja") {
    return hasVersion(to, jaPath) ? localePath(to, jaPath) : localePath(to, "/");
  }
  if (from === "ja") return p;
  return hasVersion(from, jaPath) ? jaPath : "/";
}
