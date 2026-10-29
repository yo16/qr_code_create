import sitemap from "@/app/sitemap";
import { getGuideSlugList } from "@/lib/content/getGuide";
import { getUseCaseSlugList } from "@/lib/content/getUseCase";
import { getBlogSlugList } from "@/lib/content/getBlog";
import { NON_JA_LOCALES } from "@/i18n/locales";
import { FEATURE_FLAGS } from "@/lib/constants/features";
import { PAGE_METADATA } from "@/lib/metadata/buildMetadata";
import { getGuide } from "@/lib/content/getGuide";
import { getUseCase } from "@/lib/content/getUseCase";
import { getBlog } from "@/lib/content/getBlog";

// 静的ページ: /, /create, /guide, /use-cases, /blog, /faq, /contact, /privacy, /terms の 9 件 + /poster（公開済み）の 10 件。
// そこから noIndex のページ（privacy・terms）を除いた数が sitemap に載る
const NOINDEX_PATHS = Object.values(PAGE_METADATA)
  .filter((page) => "noIndex" in page && page.noIndex === true)
  .map((page) => page.path);
const STATIC_PAGE_COUNT = 10 - NOINDEX_PATHS.length;

describe("sitemap", () => {
  describe("エントリ数の検証", () => {
    it("合計エントリ数が静的ページ + ガイド + use-cases + blog + 英語版であること", () => {
      const guideCount = getGuideSlugList().length;
      const useCaseCount = getUseCaseSlugList().length;
      const blogCount = getBlogSlugList().length;
      // qr_code_create-01z.7: 英語版 /en、/en/create、/en/guide/{slug}（現状 3 件）
      // M4: es / pt-br / de も同じ 3 件ずつ（設計書 11.1）。ja 以外の言語数 x 3
      const enCount = NON_JA_LOCALES.length * (2 + getGuideSlugList("en").length);
      expect(enCount).toBe(12);
      expect(NOINDEX_PATHS.sort()).toEqual(["/privacy", "/terms"]);
      expect(STATIC_PAGE_COUNT).toBe(8);
      const expectedTotal = STATIC_PAGE_COUNT + guideCount + useCaseCount + blogCount + enCount;
      const result = sitemap();
      expect(result).toHaveLength(expectedTotal);
    });
  });

  describe("静的ページの検証", () => {
    it("トップページ（/）が含まれること", () => {
      const result = sitemap();
      const topPage = result.find((entry) => {
        const url = new URL(entry.url);
        return url.pathname === "/";
      });
      expect(topPage).toBeDefined();
    });

    it("トップページ（/）のpriorityが1.0であること", () => {
      const result = sitemap();
      const topPage = result.find((entry) => {
        const url = new URL(entry.url);
        return url.pathname === "/";
      });
      expect(topPage?.priority).toBe(1.0);
    });

    const staticPageExpectations = [
      { path: "/create", changeFrequency: "monthly", priority: 0.9 },
      { path: "/guide", changeFrequency: "weekly", priority: 0.8 },
      { path: "/use-cases", changeFrequency: "weekly", priority: 0.8 },
      { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
      { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
      { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
    ];

    it.each(staticPageExpectations)(
      "$pathページが含まれ、changeFrequency=$changeFrequency、priority=$priorityであること",
      ({ path, changeFrequency, priority }) => {
        const result = sitemap();
        const page = result.find((entry) => {
          const url = new URL(entry.url);
          return url.pathname === path;
        });
        expect(page).toBeDefined();
        expect(page?.changeFrequency).toBe(changeFrequency);
        expect(page?.priority).toBe(priority);
      }
    );

    it("/poster が既定で含まれること（posterPage は true で公開済み）", () => {
      // 意図: 公開した /poster を検索エンジンに伝える。モックなしの既定値で確かめる
      expect(FEATURE_FLAGS.posterPage).toBe(true);
      const result = sitemap();
      const posterPages = result.filter((entry) => new URL(entry.url).pathname === "/poster");
      expect(posterPages).toHaveLength(1);
    });

    it("/poster は changeFrequency=monthly、priority=0.8 で、英語版の alternates を持たないこと", () => {
      // 意図: /poster に英語版は無いので hreflang の alternates を付けない
      const result = sitemap();
      const page = result.find((entry) => new URL(entry.url).pathname === "/poster");
      expect(page).toBeDefined();
      expect(page?.changeFrequency).toBe("monthly");
      expect(page?.priority).toBe(0.8);
      expect(page?.alternates).toBeUndefined();
    });
  });

  describe("ガイドページの検証", () => {
    it("全ガイドslugがサイトマップに含まれること", () => {
      const guideSlugs = getGuideSlugList();
      const result = sitemap();
      for (const slug of guideSlugs) {
        const page = result.find((entry) => {
          const url = new URL(entry.url);
          return url.pathname === `/guide/${slug}`;
        });
        expect(page).toBeDefined();
      }
    });

    it("ガイドページのchangeFrequencyがmonthly、priorityが0.7であること", () => {
      const result = sitemap();
      const guidePages = result.filter((entry) => {
        const url = new URL(entry.url);
        return url.pathname.startsWith("/guide/");
      });
      for (const page of guidePages) {
        expect(page.changeFrequency).toBe("monthly");
        expect(page.priority).toBe(0.7);
      }
    });
  });

  describe("use-casesページの検証", () => {
    it("全use-case slugがサイトマップに含まれること", () => {
      const useCaseSlugs = getUseCaseSlugList();
      const result = sitemap();
      for (const slug of useCaseSlugs) {
        const page = result.find((entry) => {
          const url = new URL(entry.url);
          return url.pathname === `/use-cases/${slug}`;
        });
        expect(page).toBeDefined();
      }
    });

    it("use-casesページのchangeFrequencyがmonthly、priorityが0.7であること", () => {
      const result = sitemap();
      const useCasePages = result.filter((entry) => {
        const url = new URL(entry.url);
        return url.pathname.startsWith("/use-cases/");
      });
      for (const page of useCasePages) {
        expect(page.changeFrequency).toBe("monthly");
        expect(page.priority).toBe(0.7);
      }
    });
  });

  describe("noIndex の除外", () => {
    it("/privacy と /terms が含まれないこと", () => {
      const paths = sitemap().map((entry) => new URL(entry.url).pathname);
      expect(paths).not.toContain("/privacy");
      expect(paths).not.toContain("/terms");
    });

    it("PAGE_METADATA の noIndex が true の path がすべて sitemap に無いこと", () => {
      expect(NOINDEX_PATHS.length).toBeGreaterThan(0);
      const paths = sitemap().map((entry) => new URL(entry.url).pathname);
      for (const p of NOINDEX_PATHS) expect(paths).not.toContain(p);
    });
  });

  describe("lastModifiedの検証", () => {
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    const pathOf = (url: string) => new URL(url).pathname;

    it("ja の記事（guide・use-cases・blog）の lastModified が frontmatter の updated ?? date と一致すること", () => {
      const result = sitemap();
      const cases: { path: string; content: { date: string; updated?: string } | null }[] = [
        ...getGuideSlugList().map((s) => ({ path: `/guide/${s}`, content: getGuide(s) })),
        ...getUseCaseSlugList().map((s) => ({ path: `/use-cases/${s}`, content: getUseCase(s) })),
        ...getBlogSlugList().map((s) => ({ path: `/blog/${s}`, content: getBlog(s) })),
      ];
      expect(cases.length).toBeGreaterThan(0);
      for (const { path, content } of cases) {
        const entry = result.find((e) => pathOf(e.url) === path);
        expect(content).not.toBeNull();
        expect(entry?.lastModified).toBe(content?.updated ?? content?.date);
      }
    });

    it("各言語のガイドの lastModified が、その言語の記事の updated ?? date と一致すること", () => {
      const result = sitemap();
      for (const locale of NON_JA_LOCALES) {
        const slugs = getGuideSlugList(locale);
        expect(slugs.length).toBeGreaterThan(0);
        for (const slug of slugs) {
          const content: { date: string; updated?: string } | null = getGuide(slug, locale);
          const entry = result.find((e) => pathOf(e.url).endsWith(`/guide/${slug}`) && pathOf(e.url).startsWith(`/${locale}/`));
          expect(entry).toBeDefined();
          expect(entry?.lastModified).toBe(content?.updated ?? content?.date);
        }
      }
    });

    it("記事の lastModified が YYYY-MM-DD の文字列で、Date ではないこと", () => {
      const articles = sitemap().filter((e) => /\/(guide|use-cases|blog)\//.test(pathOf(e.url)));
      expect(articles.length).toBeGreaterThan(0);
      for (const entry of articles) {
        expect(typeof entry.lastModified).toBe("string");
        expect(entry.lastModified).toMatch(isoDate);
      }
    });

    it("固定ページ（トップ・/create・/guide・/use-cases・/blog・/faq・/contact・/poster・各言語のトップと /create）に lastModified が無いこと", () => {
      const fixedPaths = new Set(["/", "/create", "/guide", "/use-cases", "/blog", "/faq", "/contact", "/poster"]);
      for (const l of NON_JA_LOCALES) {
        fixedPaths.add(`/${l}`);
        fixedPaths.add(`/${l}/create`);
      }
      const fixed = sitemap().filter((e) => fixedPaths.has(pathOf(e.url)));
      // 8 件 + 各言語 2 件
      expect(fixed).toHaveLength(8 + NON_JA_LOCALES.length * 2);
      for (const entry of fixed) {
        expect(entry).not.toHaveProperty("lastModified");
      }
    });

    it("sitemap() を 2 回呼んでも結果が同じで、時刻をずらしても変わらないこと", () => {
      jest.useFakeTimers();
      try {
        jest.setSystemTime(Date.UTC(2026, 0, 1));
        const first = sitemap();
        jest.setSystemTime(Date.UTC(2030, 5, 15));
        const second = sitemap();
        expect(second).toEqual(first);
        expect(sitemap()).toEqual(first);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe("フォールバックURLのテスト", () => {
    it("全エントリのURLが有効なURL形式であること", () => {
      const result = sitemap();
      result.forEach((entry) => {
        expect(() => new URL(entry.url)).not.toThrow();
      });
    });

    it("全エントリのURLがhttps://で始まること", () => {
      const result = sitemap();
      result.forEach((entry) => {
        expect(entry.url).toMatch(/^https:\/\//);
      });
    });
  });
});
