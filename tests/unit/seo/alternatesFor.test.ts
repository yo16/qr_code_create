import { alternatesFor } from "@/lib/seo/alternates";
import { LOCALES } from "@/i18n/locales";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";
import { hasVersion, localePath } from "@/lib/i18n/routes";

/**
 * alternatesFor（実設定）。設計: doc/design/i18n-multi.md 7 節
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

const TRANSLATED = ["/", "/create", "/guide/getting-started"];

function expectedLanguages(jaPath: string, bareRoot = false): Record<string, string> {
  const result: Record<string, string> = {};
  for (const locale of LOCALES) {
    if (!hasVersion(locale, jaPath)) continue;
    const path = localePath(locale, jaPath);
    result[LOCALE_CONFIG[locale].hreflang] = bareRoot && path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  }
  result["x-default"] = result[LOCALE_CONFIG.ja.hreflang];
  return result;
}

describe("alternatesFor: 翻訳のあるページ", () => {
  // 意図: キーの集合は hasVersion が真の全言語の hreflang と x-default
  it.each(TRANSLATED)("%s は hasVersion が真の全言語 + x-default のキーを持つ", (jaPath) => {
    const keys = LOCALES.filter((l) => hasVersion(l, jaPath)).map((l) => LOCALE_CONFIG[l].hreflang);
    const result = alternatesFor(jaPath);
    expect(result).toBeDefined();
    expect(Object.keys(result?.languages ?? {}).sort()).toEqual([...keys, "x-default"].sort());
  });

  // 意図: 値は SITE_URL + localePath
  it.each(TRANSLATED)("%s の値が SITE_URL + localePath", (jaPath) => {
    const languages = alternatesFor(jaPath)?.languages ?? {};
    for (const locale of LOCALES) {
      if (!hasVersion(locale, jaPath)) continue;
      expect(languages[LOCALE_CONFIG[locale].hreflang]).toBe(`${SITE_URL}${localePath(locale, jaPath)}`);
    }
  });

  // 意図: x-default は ja を指す
  it.each(TRANSLATED)("%s の x-default は ja の値と同じ", (jaPath) => {
    const languages = alternatesFor(jaPath)?.languages ?? {};
    expect(languages["x-default"]).toBeDefined();
    expect(languages["x-default"]).toBe(languages[LOCALE_CONFIG.ja.hreflang]);
  });
});

describe("alternatesFor: 翻訳の無いページ", () => {
  // 意図: ja にしか無い、存在しない、空文字のパスは hreflang を出さない
  it.each(["/faq", "/guide/utm-setup", "/guide/no-such-slug", ""])("%j は undefined", (jaPath) => {
    expect(alternatesFor(jaPath)).toBeUndefined();
  });
});

describe("alternatesFor: bareRoot", () => {
  // 意図: bareRoot のとき ja トップだけ末尾スラッシュなし
  it("bareRoot: true で ja トップが SITE_URL（末尾スラッシュなし）", () => {
    const languages = alternatesFor("/", { bareRoot: true })?.languages ?? {};
    expect(languages.ja).toBe(SITE_URL);
    expect(languages["x-default"]).toBe(SITE_URL);
  });

  it("bareRoot 無しでは ja トップが末尾スラッシュ付き", () => {
    const languages = alternatesFor("/")?.languages ?? {};
    expect(languages.ja).toBe(`${SITE_URL}/`);
    expect(languages["x-default"]).toBe(`${SITE_URL}/`);
  });

  // 意図: ja の他のパスと ja 以外の言語は bareRoot で変わらない
  it.each(TRANSLATED)("%s: ja トップ以外の値は bareRoot の有無で変わらない", (jaPath) => {
    const bare = alternatesFor(jaPath, { bareRoot: true })?.languages ?? {};
    const plain = alternatesFor(jaPath)?.languages ?? {};
    for (const key of Object.keys(plain)) {
      if (jaPath === "/" && (key === "ja" || key === "x-default")) continue;
      expect(bare[key]).toBe(plain[key]);
    }
    expect(bare).toEqual(expectedLanguages(jaPath, true));
  });

  it("翻訳の無いパスでは bareRoot: true でも undefined", () => {
    expect(alternatesFor("/faq", { bareRoot: true })).toBeUndefined();
  });
});
