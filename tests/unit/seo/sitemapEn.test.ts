import sitemap from "@/app/sitemap";
import { getGuideSlugList } from "@/lib/content/getGuide";
import { EN_AVAILABLE_PATHS } from "@/lib/i18n/routes";

/**
 * sitemap の英語版エントリと hreflang（qr_code_create-01z.7）。
 * 設計: doc/design/i18n-en.md 7.3
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

type Entry = ReturnType<typeof sitemap>[number];
const byUrl = (entries: Entry[], url: string) => entries.find((e) => e.url === url);

// 両言語が揃う 3 組（ja の loc、en の loc、期待する languages）
const PAIRS = [
  { ja: `${SITE_URL}`, en: `${SITE_URL}/en`, rest: { es: `${SITE_URL}/es`, "pt-BR": `${SITE_URL}/pt-br`, de: `${SITE_URL}/de` } },
  { ja: `${SITE_URL}/create`, en: `${SITE_URL}/en/create`, rest: { es: `${SITE_URL}/es/create`, "pt-BR": `${SITE_URL}/pt-br/create`, de: `${SITE_URL}/de/create` } },
  {
    ja: `${SITE_URL}/guide/getting-started`,
    en: `${SITE_URL}/en/guide/getting-started`,
    rest: { es: `${SITE_URL}/es/guide/getting-started`, "pt-BR": `${SITE_URL}/pt-br/guide/getting-started`, de: `${SITE_URL}/de/guide/getting-started` },
  },
];
// M4（設計書 11.1）: es / pt-BR / de のキーとエントリを足す。ja / en / x-default の値は変えない
const ALL_URLS = PAIRS.flatMap((p) => [p.ja, p.en, ...Object.values(p.rest)]);

describe("sitemap の英語版", () => {
  // 意図: en のエントリは /en、/en/create、/en/guide/getting-started の 3 件だけ
  it("en のエントリが 3 件で URL が期待どおり", () => {
    const enUrls = sitemap()
      .map((e) => e.url)
      .filter((u) => new URL(u).pathname === "/en" || new URL(u).pathname.startsWith("/en/"));
    expect(enUrls.sort()).toEqual(
      [`${SITE_URL}/en`, `${SITE_URL}/en/create`, `${SITE_URL}/en/guide/getting-started`].sort()
    );
  });

  // 意図: en ガイドのエントリが getGuideSlugList("en") と一致する（英語 MDX を足せば自動で増える）
  it("en ガイドのエントリが getGuideSlugList(\"en\") と一致", () => {
    const enGuides = sitemap()
      .map((e) => new URL(e.url).pathname)
      .filter((p) => p.startsWith("/en/guide/"));
    expect(enGuides.sort()).toEqual(getGuideSlugList("en").map((s) => `/en/guide/${s}`).sort());
  });

  // 意図: 英語版の対応表（EN_AVAILABLE_PATHS）と sitemap の en 件数が食い違わない
  it("en のエントリ数が EN_AVAILABLE_PATHS の件数と同じ", () => {
    const enCount = sitemap().filter((e) => new URL(e.url).pathname.match(/^\/en(\/|$)/)).length;
    expect(enCount).toBe(EN_AVAILABLE_PATHS.length);
  });

  // 意図: URL の重複が無い
  it("URL が重複しない", () => {
    const urls = sitemap().map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("全言語が揃う 15 エントリの alternates.languages", () => {
  // 意図: 全言語のエントリに、同じ 6 キーが付く（x-default = ja）
  it.each(PAIRS)("$ja と $en に同じ 6 キー", ({ ja, en, rest }) => {
    const entries = sitemap();
    const want = { languages: { ja, en, ...rest, "x-default": ja } };
    const jaEntry = byUrl(entries, ja);
    const enEntry = byUrl(entries, en);
    expect(jaEntry).toBeDefined();
    expect(enEntry).toBeDefined();
    expect(jaEntry?.alternates).toEqual(want);
    expect(enEntry?.alternates).toEqual(want);
    for (const url of Object.values(rest)) expect(byUrl(entries, url)?.alternates).toEqual(want);
    expect(Object.keys(jaEntry?.alternates?.languages ?? {}).sort()).toEqual(["de", "en", "es", "ja", "pt-BR", "x-default"]);
  });

  // 意図: 自己参照。各エントリの loc が自分の言語の alternates と同じ文字列
  // （ja ホームは loc が末尾スラッシュなしの SITE_URL で、alternates の ja も同じ表記）
  it.each(PAIRS)("$ja / $en の loc が alternates の自分の言語と同じ表記", ({ ja, en }) => {
    const entries = sitemap();
    expect(byUrl(entries, ja)?.alternates?.languages?.ja).toBe(ja);
    expect(byUrl(entries, en)?.alternates?.languages?.en).toBe(en);
  });

  it("ja ホームの loc は SITE_URL（末尾スラッシュなし）で、alternates の ja / x-default も同じ", () => {
    const home = sitemap()[0];
    expect(home.url).toBe(SITE_URL);
    expect(home.alternates?.languages).toMatchObject({ ja: SITE_URL, "x-default": SITE_URL });
  });

  // 意図: alternates を持つエントリはこの 15 件だけ
  it("alternates を持つエントリはちょうど 15 件", () => {
    const withAlternates = sitemap()
      .filter((e) => e.alternates !== undefined)
      .map((e) => e.url)
      .sort();
    expect(withAlternates).toEqual([...ALL_URLS].sort());
  });
});

describe("ja のみのページ", () => {
  // 意図: 英語版の無いページに alternates が付かない
  it.each(["/faq", "/guide", "/guide/utm-setup", "/use-cases", "/blog", "/privacy", "/terms", "/contact"])(
    "%s に alternates が無い",
    (path) => {
      const entry = byUrl(sitemap(), `${SITE_URL}${path}`);
      expect(entry).toBeDefined();
      expect(entry).not.toHaveProperty("alternates");
    }
  );
});

describe("en エントリの changeFrequency", () => {
  // 意図: en の更新頻度は対応する ja 側と同じ
  it.each(PAIRS)("$en は $ja と同じ changeFrequency", ({ ja, en }) => {
    const entries = sitemap();
    const jaEntry = byUrl(entries, ja);
    const enEntry = byUrl(entries, en);
    expect(enEntry?.changeFrequency).toBeDefined();
    expect(enEntry?.changeFrequency).toBe(jaEntry?.changeFrequency);
  });
});
