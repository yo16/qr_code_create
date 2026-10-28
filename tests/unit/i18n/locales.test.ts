import { LOCALES, NON_JA_LOCALES, isLocale, isNonJaLocale } from "@/i18n/locales";
import { LOCALE_CONFIG, TRANSLATED_PATHS } from "@/lib/i18n/localeConfig";
import { getGuideSlugList } from "@/lib/content/getGuide";
import { hasVersion, localePath, splitLocale } from "@/lib/i18n/routes";

/** 多言語 M1（qr_code_create-38x.1）。設計: doc/design/i18n-multi.md 5 節 */

describe("locales", () => {
  it("LOCALES は ja を先頭に持ち、ja と en を含む", () => {
    expect(LOCALES[0]).toBe("ja");
    expect([...LOCALES]).toEqual(expect.arrayContaining(["ja", "en"]));
  });

  it("NON_JA_LOCALES に ja は無く、LOCALES から ja を除いたものと一致する", () => {
    expect(NON_JA_LOCALES).not.toContain("ja");
    expect([...NON_JA_LOCALES]).toEqual(LOCALES.filter((l) => l !== "ja"));
  });

  it.each([
    ["ja", true],
    ["en", true],
    ["EN", false],
    ["es", false],
    ["", false],
    ["/en", false],
  ])("isLocale(%j) は %s", (v, expected) => {
    expect(isLocale(v)).toBe(expected);
  });

  it.each([
    ["ja", false],
    ["en", true],
    ["EN", false],
    ["es", false],
    ["", false],
    ["/en", false],
  ])("isNonJaLocale(%j) は %s", (v, expected) => {
    expect(isNonJaLocale(v)).toBe(expected);
  });
});

describe("LOCALE_CONFIG", () => {
  it("キーの集合が LOCALES と一致する", () => {
    expect(Object.keys(LOCALE_CONFIG).sort()).toEqual([...LOCALES].sort());
  });

  it.each([...LOCALES])("%s の prefix は ja なら空、他は / + locale", (locale) => {
    expect(LOCALE_CONFIG[locale].prefix).toBe(locale === "ja" ? "" : `/${locale}`);
  });

  it("ja / en の htmlLang と hreflang は具体値", () => {
    expect(LOCALE_CONFIG.ja.htmlLang).toBe("ja");
    expect(LOCALE_CONFIG.ja.hreflang).toBe("ja");
    expect(LOCALE_CONFIG.en.htmlLang).toBe("en");
    expect(LOCALE_CONFIG.en.hreflang).toBe("en");
  });

  it.each([...LOCALES])("%s の各項目が一般則を満たす", (locale) => {
    const c = LOCALE_CONFIG[locale];
    expect(c.htmlLang.toLowerCase()).toBe(locale.toLowerCase());
    expect(c.hreflang).toBe(c.htmlLang);
    expect(c.htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
    expect(c.ogLocale).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
    expect(c.nativeName.length).toBeGreaterThan(0);
    expect(c.shortName.length).toBeGreaterThan(0);
    expect(["JPY", "USD", "EUR", "BRL"]).toContain(c.currency);
    expect(c.poster).toBe(locale === "ja");
  });

  it("prefix は一意で、どれも他の prefix の前方一致にならない", () => {
    const prefixes: string[] = LOCALES.map((l): string => LOCALE_CONFIG[l].prefix).filter(
      (p) => p !== ""
    );
    expect(new Set(prefixes).size).toBe(prefixes.length);
    for (const a of prefixes) {
      for (const b of prefixes) {
        if (a !== b) expect(b.startsWith(a)).toBe(false);
      }
    }
  });

  it.each([...NON_JA_LOCALES])("%s の prefix は / で始まり末尾が / でない", (locale) => {
    const { prefix } = LOCALE_CONFIG[locale];
    expect(prefix.startsWith("/")).toBe(true);
    expect(prefix.endsWith("/")).toBe(false);
  });

  it.each([...LOCALES])("%s: splitLocale(localePath(l, p)) が元に戻る", (locale) => {
    for (const p of ["/", "/create", "/guide/x"]) {
      expect(splitLocale(localePath(locale, p))).toEqual({ locale, jaPath: p });
    }
  });

  it("通貨は ja が JPY、en が USD", () => {
    expect(LOCALE_CONFIG.ja.currency).toBe("JPY");
    expect(LOCALE_CONFIG.en.currency).toBe("USD");
  });

  it("ja は全ページ、en は TRANSLATED_PATHS を持つ", () => {
    expect(LOCALE_CONFIG.ja.paths).toBe("all");
    expect(LOCALE_CONFIG.en.paths).toEqual(TRANSLATED_PATHS);
  });

  it("TRANSLATED_PATHS が hasVersion に反映され、含まれないパスは false", () => {
    for (const p of TRANSLATED_PATHS) {
      expect(hasVersion("en", p)).toBe(true);
    }
    expect(hasVersion("en", "/faq")).toBe(false);
    expect(hasVersion("en", "/poster")).toBe(false);
  });

  it.each([...LOCALES].filter((l) => l !== "ja"))(
    "%s: TRANSLATED_PATHS のガイド部分と getGuideSlugList(locale) が一致する",
    (locale) => {
      const fromPaths = TRANSLATED_PATHS.filter((p) => p.startsWith("/guide/"))
        .map((p) => p.slice("/guide/".length))
        .sort();
      expect(getGuideSlugList(locale).sort()).toEqual(fromPaths);
    }
  );
});
