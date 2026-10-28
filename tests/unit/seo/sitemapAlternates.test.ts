import sitemap from "@/app/sitemap";
import { alternatesFor } from "@/lib/seo/alternates";
import { NON_JA_LOCALES } from "@/i18n/locales";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";
import { localePath, splitLocale } from "@/lib/i18n/routes";

/**
 * sitemap の alternates が alternatesFor と一致し、ja 以外のエントリが LOCALE_CONFIG から出ること。
 * 設計: doc/design/i18n-multi.md 7 節
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

function pathsOf(locale: (typeof NON_JA_LOCALES)[number]): readonly string[] {
  const paths: "all" | readonly string[] = LOCALE_CONFIG[locale].paths as "all" | readonly string[];
  if (paths === "all") throw new Error("非 ja 言語の paths が all になっている");
  return paths;
}

const jaPathOf =(url: string): string => splitLocale(new URL(url).pathname).jaPath;

describe("sitemap の alternates", () => {
  // 意図: 全エントリで、alternates は alternatesFor(bareRoot) と同じ。無い場合はプロパティ自体が無い
  it("各エントリの alternates が alternatesFor(jaPath, { bareRoot: true }) と一致", () => {
    const entries = sitemap();
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      const expected = alternatesFor(jaPathOf(entry.url), { bareRoot: true });
      if (expected) {
        expect({ url: entry.url, alternates: entry.alternates }).toEqual({ url: entry.url, alternates: expected });
      } else {
        expect(entry).not.toHaveProperty("alternates");
      }
    }
  });

  // 意図: 翻訳のあるページは ja 側にも ja 以外側にも alternates が付く
  it("LOCALE_CONFIG の paths の各ページは全言語のエントリに alternates が付く", () => {
    const entries = sitemap();
    for (const locale of NON_JA_LOCALES) {
      const paths = pathsOf(locale);
      for (const jaPath of paths) {
        const jaUrl = jaPath === "/" ? SITE_URL : `${SITE_URL}${jaPath}`;
        const localeUrl = `${SITE_URL}${localePath(locale, jaPath)}`;
        expect(entries.find((e) => e.url === jaUrl)?.alternates).toBeDefined();
        expect(entries.find((e) => e.url === localeUrl)?.alternates).toBeDefined();
      }
    }
  });
});

describe("sitemap の ja 以外のエントリ", () => {
  // 意図: ja 以外の言語のエントリは LOCALE_CONFIG の paths から出る（今は en の 3 件）
  it.each(NON_JA_LOCALES)("%s のエントリが LOCALE_CONFIG の paths と一致", (locale) => {
    const paths = pathsOf(locale);
    const prefix = LOCALE_CONFIG[locale].prefix;
    const urls = sitemap()
      .map((e) => e.url)
      .filter((u) => {
        const p = new URL(u).pathname;
        return p === prefix || p.startsWith(`${prefix}/`);
      });
    expect(urls.sort()).toEqual(paths.map((p) => `${SITE_URL}${localePath(locale, p)}`).sort());
  });

  it("sitemap の en エントリ数が LOCALE_CONFIG.en.paths の長さと一致", () => {
    const enCount = sitemap().filter((e) => /^\/en(\/|$)/.test(new URL(e.url).pathname)).length;
    expect(enCount).toBe(pathsOf("en").length);
  });

  // 意図: 同じ URL のエントリが 2 つ出ない
  it("URL が重複しない", () => {
    const urls = sitemap().map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
