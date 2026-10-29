import sitemap from "@/app/sitemap";
import { getGuideSlugList } from "@/lib/content/getGuide";
import { getUseCaseSlugList } from "@/lib/content/getUseCase";
import { getBlogSlugList } from "@/lib/content/getBlog";
import { NON_JA_LOCALES } from "@/i18n/locales";

// jest.mock はファイル単位で固定されるため、次の 2 つの構成をこのファイルにまとめる。
// - PAGE_METADATA に noIndex を足し、sitemap から自動で外れること（/faq と home を noIndex にする）
// - updated を持つ記事と、取得できない記事（null）を作り、lastModified の優先順位と欠落を確かめる
jest.mock("@/lib/metadata/buildMetadata", () => {
  const actual = jest.requireActual<typeof import("@/lib/metadata/buildMetadata")>("@/lib/metadata/buildMetadata");
  return {
    ...actual,
    PAGE_METADATA: {
      ...actual.PAGE_METADATA,
      home: { ...actual.PAGE_METADATA.home, noIndex: true },
      faq: { ...actual.PAGE_METADATA.faq, noIndex: true },
    },
  };
});

jest.mock("@/lib/content/getGuide", () => {
  const actual = jest.requireActual<typeof import("@/lib/content/getGuide")>("@/lib/content/getGuide");
  return {
    ...actual,
    getGuide: (slug: string, locale: "ja" | "en" | "es" | "pt-br" | "de" = "ja") => {
      const base = actual.getGuide(slug, locale);
      if (base && slug === "getting-started") {
        return { ...base, date: "2020-01-01", ...{ updated: locale === "ja" ? "2026-05-05" : undefined } };
      }
      return base;
    },
  };
});

jest.mock("@/lib/content/getUseCase", () => {
  const actual = jest.requireActual<typeof import("@/lib/content/getUseCase")>("@/lib/content/getUseCase");
  return {
    ...actual,
    // 先頭の slug は取得できない（null）ものとして扱う
    getUseCase: (slug: string) => (slug === actual.getUseCaseSlugList()[0] ? null : actual.getUseCase(slug)),
  };
});

jest.mock("@/lib/content/getBlog", () => {
  const actual = jest.requireActual<typeof import("@/lib/content/getBlog")>("@/lib/content/getBlog");
  return {
    ...actual,
    getBlog: (slug: string) => {
      const base = actual.getBlog(slug);
      return base && slug === actual.getBlogSlugList()[0] ? { ...base, date: "2020-02-02", updated: "2026-06-06" } : base;
    },
  };
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";
const pathOf = (url: string) => new URL(url).pathname;

describe("sitemap（モック構成）", () => {
  describe("noIndex の自動除外", () => {
    it("noIndex を足した /faq が sitemap から外れること", () => {
      const paths = sitemap().map((e) => pathOf(e.url));
      expect(paths).not.toContain("/faq");
    });

    it("noIndex を足した ja トップ（url は SITE_URL そのもの）が外れること", () => {
      const urls = sitemap().map((e) => e.url);
      expect(urls).not.toContain(SITE_URL);
      expect(urls).not.toContain(`${SITE_URL}/`);
    });

    it("ja のトップを noIndex にすると各言語のトップも無く、/create・/en/create・/contact は残る（元から noIndex の /privacy は無い）", () => {
      const paths = sitemap().map((e) => pathOf(e.url));
      for (const l of NON_JA_LOCALES) expect(paths).not.toContain(`/${l}`);
      expect(paths).toContain("/create");
      expect(paths).toContain("/en/create");
      expect(paths).toContain("/contact");
      expect(paths).not.toContain("/privacy");
      expect(paths).not.toContain("/terms");
    });

    it("件数は ja の 2 件（home・faq）と各言語のトップ（言語数ぶん）だけ減ること", () => {
      // 既定（privacy・terms 除外）の静的 8 件 -> 6 件。各言語は トップを除いた /create とガイド
      const guide = getGuideSlugList().length;
      const others = guide + getUseCaseSlugList().length + getBlogSlugList().length;
      const enCount = NON_JA_LOCALES.length * (2 + getGuideSlugList("en").length) - NON_JA_LOCALES.length;
      expect(sitemap()).toHaveLength(6 + others + enCount);
    });
  });

  describe("updated の優先", () => {
    it("updated を持つ ja ガイドの lastModified が updated になること（date ではない）", () => {
      const entry = sitemap().find((e) => pathOf(e.url) === "/guide/getting-started");
      expect(entry?.lastModified).toBe("2026-05-05");
    });

    it("updated が無い言語のガイドは date になること", () => {
      const entry = sitemap().find((e) => pathOf(e.url) === "/en/guide/getting-started");
      expect(entry?.lastModified).toBe("2020-01-01");
    });

    it("updated を持つ blog の lastModified が updated になること", () => {
      const slug = getBlogSlugList()[0];
      const entry = sitemap().find((e) => pathOf(e.url) === `/blog/${slug}`);
      expect(entry?.lastModified).toBe("2026-06-06");
    });

    it("記事を取得できない（null）場合はエントリは残り、lastModified は付かないこと", () => {
      const slug = getUseCaseSlugList()[0];
      const entry = sitemap().find((e) => pathOf(e.url) === `/use-cases/${slug}`);
      expect(entry).toBeDefined();
      expect(entry).not.toHaveProperty("lastModified");
    });

    it("updated があっても、2 回呼んだ結果が同じであること", () => {
      expect(sitemap()).toEqual(sitemap());
    });
  });
});
