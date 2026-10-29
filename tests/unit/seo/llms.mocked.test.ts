import { NON_JA_LOCALES } from "@/i18n/locales";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";

// faq と home を noindex にしたとき、llms.txt と sitemap から外れることを確かめる。
// jest.doMock は resetModules のあとに require したモジュールにだけ効く
const SITE = "https://qr-create.jp";

function load(): { llms: string; sitemapUrls: string[] } {
  jest.resetModules();
  jest.doMock("@/lib/metadata/buildMetadata", () => {
    const actual = jest.requireActual<typeof import("@/lib/metadata/buildMetadata")>("@/lib/metadata/buildMetadata");
    return {
      ...actual,
      PAGE_METADATA: {
        ...actual.PAGE_METADATA,
        faq: { ...actual.PAGE_METADATA.faq, noIndex: true },
        home: { ...actual.PAGE_METADATA.home, noIndex: true },
      },
    };
  });
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { buildLlmsTxt } = require("@/lib/seo/llmsTxt") as typeof import("@/lib/seo/llmsTxt");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sitemap = (require("@/app/sitemap") as typeof import("@/app/sitemap")).default;
  return { llms: buildLlmsTxt(), sitemapUrls: sitemap().map((e) => e.url) };
}

const urlsOf = (text: string): string[] => [...text.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]);

describe("faq と home が noindex のとき", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("@/lib/metadata/buildMetadata");
  });

  it("llms.txt から /faq の URL が消えること", () => {
    const { llms } = load();
    expect(urlsOf(llms)).not.toContain(`${SITE}/faq`);
  });

  it("llms.txt から ja トップ（SITE_URL そのもの）が消えること", () => {
    const { llms } = load();
    expect(urlsOf(llms)).not.toContain(SITE);
    expect(urlsOf(llms)).not.toContain(`${SITE}/`);
  });

  it.each(NON_JA_LOCALES)("llms.txt の Other languages から %s のトップが消えること", (l) => {
    const { llms } = load();
    expect(urlsOf(llms)).not.toContain(`${SITE}${LOCALE_CONFIG[l].prefix}`);
  });

  it("/create など ほかのページは残ること", () => {
    const { llms } = load();
    const urls = urlsOf(llms);
    expect(urls).toContain(`${SITE}/create`);
    expect(urls).toContain(`${SITE}/guide`);
    for (const l of NON_JA_LOCALES) expect(urls).toContain(`${SITE}${LOCALE_CONFIG[l].prefix}/create`);
  });

  it("sitemap からも /faq と ja トップが消えること", () => {
    const { sitemapUrls } = load();
    expect(sitemapUrls).not.toContain(`${SITE}/faq`);
    expect(sitemapUrls).not.toContain(SITE);
  });

  it("同じモックで llms.txt の URL 集合と sitemap の URL 集合が一致すること", () => {
    const { llms, sitemapUrls } = load();
    const llmsUrls = urlsOf(llms);
    expect(llmsUrls.filter((u) => !sitemapUrls.includes(u))).toEqual([]);
    expect(sitemapUrls.filter((u) => !llmsUrls.includes(u))).toEqual([]);
  });
});
