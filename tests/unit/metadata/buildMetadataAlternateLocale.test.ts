import { buildMetadata } from "@/lib/metadata/buildMetadata";
import { LOCALES } from "@/i18n/locales";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";
import { hasVersion, localePath } from "@/lib/i18n/routes";

/**
 * buildMetadata の og:locale / alternateLocale と languages の相互参照。
 * 設計: doc/design/i18n-multi.md 7 節
 */

type Og = { locale?: string; alternateLocale?: string | string[] };
const og = (m: ReturnType<typeof buildMetadata>) => m.openGraph as Og;

const TRANSLATED = ["/", "/create", "/guide/getting-started"];

const metaFor = (locale: (typeof LOCALES)[number], jaPath: string) =>
  buildMetadata({ title: "t", description: "d", path: localePath(locale, jaPath), jaPath }, locale);

describe("alternateLocale: jaPath あり", () => {
  const cases = LOCALES.flatMap((locale) => TRANSLATED.map((jaPath) => ({ locale, jaPath })));

  // 意図: og:locale は自分、alternateLocale は自分以外で hasVersion が真の言語（LOCALES 順）
  it.each(cases)("$locale $jaPath: locale と alternateLocale", ({ locale, jaPath }) => {
    const meta = og(metaFor(locale, jaPath));
    const expected = LOCALES.filter((l) => l !== locale && hasVersion(l, jaPath)).map(
      (l) => LOCALE_CONFIG[l].ogLocale
    );
    expect(meta.locale).toBe(LOCALE_CONFIG[locale].ogLocale);
    expect(meta.alternateLocale).toEqual(expected);
    expect(meta.alternateLocale).not.toContain(LOCALE_CONFIG[locale].ogLocale);
  });
});

describe("alternateLocale: jaPath なし・翻訳の無いページ", () => {
  // 意図: jaPath 無しは alternateLocale も languages も出ない
  it.each(LOCALES)("%s: jaPath なしでは alternateLocale と languages が無い", (locale) => {
    const meta = buildMetadata({ title: "t", description: "d", path: "/faq" }, locale);
    expect(og(meta)).not.toHaveProperty("alternateLocale");
    expect(og(meta).locale).toBe(LOCALE_CONFIG[locale].ogLocale);
    expect(meta.alternates).not.toHaveProperty("languages");
  });

  // 意図: jaPath があっても翻訳の無いガイドは出ない
  it.each(["/guide/utm-setup", "/guide/no-such-slug"])("jaPath %s は alternateLocale と languages が無い", (jaPath) => {
    const meta = buildMetadata({ title: "t", description: "d", path: jaPath, jaPath }, "ja");
    expect(og(meta)).not.toHaveProperty("alternateLocale");
    expect(meta.alternates).not.toHaveProperty("languages");
  });
});

describe("languages の相互参照", () => {
  // 意図: どの言語のページから見ても languages が同じ集合（自己参照と相互参照がそろう）
  it.each(TRANSLATED)("%s: 全 LOCALES で languages が同じ", (jaPath) => {
    const sets = LOCALES.map((l) => metaFor(l, jaPath).alternates?.languages);
    for (const s of sets) {
      expect(s).toBeDefined();
      expect(s).toEqual(sets[0]);
    }
  });

  // 意図: 各ページの canonical が languages に含まれる（自己参照）
  it.each(TRANSLATED.flatMap((jaPath) => LOCALES.map((locale) => ({ locale, jaPath }))))(
    "$locale $jaPath: canonical が自分の hreflang の値と一致",
    ({ locale, jaPath }) => {
      const meta = metaFor(locale, jaPath);
      const languages = meta.alternates?.languages as Record<string, string>;
      expect(languages[LOCALE_CONFIG[locale].hreflang]).toBeDefined();
      expect(Object.values(languages)).toContain(meta.alternates?.canonical);
    }
  );
});
