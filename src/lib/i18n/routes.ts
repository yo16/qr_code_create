import type { Locale } from "@/i18n/types";

/**
 * 英語版があるページ（ja 側のパスで持つ）。
 * 英語版のページを追加したら、ここにも追加する。英語版の無いページへの導線は、これに含まれるかで出し分ける。
 */
export const EN_AVAILABLE_PATHS: readonly string[] = ["/", "/create", "/guide/getting-started"];

/** ja 側のパスに英語版があるか */
export function hasEnVersion(path: string): boolean {
  return EN_AVAILABLE_PATHS.includes(path);
}

/**
 * ロケールに応じたパスを返す。
 * ja は日本語版のパスそのまま、en は `/en` を前置する（`/` は `/en`）。
 * getAlternatePath は T5a で追加する。
 */
export function localePath(locale: Locale, path: string): string {
  if (locale === "ja") return path;
  if (path === "/" || path === "") return "/en";
  return `/en${path.startsWith("/") ? path : `/${path}`}`;
}
