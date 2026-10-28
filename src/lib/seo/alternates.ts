import { LOCALES, NON_JA_LOCALES } from "@/i18n/locales";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";
import { hasVersion, localePath } from "@/lib/i18n/routes";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

export interface AlternatesOptions {
  /** true なら ja のトップを SITE_URL（末尾スラッシュなし）で返す。sitemap の loc の表記に合わせる用 */
  bareRoot?: boolean;
}

/**
 * jaPath を持つ全言語の hreflang → 絶対 URL。x-default は ja。
 * ja 以外に 1 つも無ければ undefined（hreflang を出さない）。
 * どの言語のページから呼んでも同じ集合になるので、自己参照と相互参照は自動でそろう。
 */
export function alternatesFor(
  jaPath: string,
  options: AlternatesOptions = {}
): { languages: Record<string, string> } | undefined {
  const hasOther = NON_JA_LOCALES.some((locale) => hasVersion(locale, jaPath));
  if (!hasOther) return undefined;

  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    if (!hasVersion(locale, jaPath)) continue;
    const path = localePath(locale, jaPath);
    languages[LOCALE_CONFIG[locale].hreflang] =
      options.bareRoot && path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  }
  languages["x-default"] = languages[LOCALE_CONFIG.ja.hreflang];
  return { languages };
}
