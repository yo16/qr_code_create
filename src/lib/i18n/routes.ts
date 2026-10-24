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
 * 現在のパスに対応する、相手言語のパスを返す（言語切り替え用）。
 * 対応ページが無ければ相手言語のトップ。末尾スラッシュは除いて判定する。
 * to=en でも /en 配下のパスが来うる: global-not-found が ja のシェルで /en 配下の未定義 URL を描くため、
 * その場合は /en を外した ja 側のパスとして判定し、自分自身を指さないようにする。
 */
export function getAlternatePath(pathname: string, to: Locale): string {
  let p = pathname.split(/[?#]/)[0] || "/";
  if (p.length > 1) p = p.replace(/\/+$/, "") || "/";
  if (to === "en") {
    // /en 配下は先頭の /en を外して ja 側のパスにしてから判定する
    if (p === "/en") p = "/";
    else if (p.startsWith("/en/")) p = p.slice(3);
    return hasEnVersion(p) ? localePath("en", p) : "/en";
  }
  if (p === "/en") return "/";
  if (p.startsWith("/en/")) {
    const jaPath = p.slice(3);
    return hasEnVersion(jaPath) ? jaPath : "/";
  }
  return p;
}

/**
 * ロケールに応じたパスを返す。
 * ja は日本語版のパスそのまま、en は `/en` を前置する（`/` は `/en`）。
 */
export function localePath(locale: Locale, path: string): string {
  if (locale === "ja") return path;
  if (path === "/" || path === "") return "/en";
  return `/en${path.startsWith("/") ? path : `/${path}`}`;
}
