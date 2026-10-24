import type { Locale } from "@/i18n/types";

/**
 * ロケールに応じたパスを返す。
 * ja は日本語版のパスそのまま、en は `/en` を前置する（`/` は `/en`）。
 * getAlternatePath と EN_AVAILABLE_PATHS は T5a で追加する。
 */
export function localePath(locale: Locale, path: string): string {
  if (locale === "ja") return path;
  if (path === "/" || path === "") return "/en";
  return `/en${path.startsWith("/") ? path : `/${path}`}`;
}
