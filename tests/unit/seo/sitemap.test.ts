import sitemap from "@/app/sitemap";
import { getGuideSlugList } from "@/lib/content/getGuide";
import { getUseCaseSlugList } from "@/lib/content/getUseCase";
import { getBlogSlugList } from "@/lib/content/getBlog";
import { FEATURE_FLAGS } from "@/lib/constants/features";

// 静的ページ: /, /create, /guide, /use-cases, /blog, /faq, /contact, /privacy, /terms の 9 件
// /poster は公開済み（FEATURE_FLAGS.posterPage = true）なので追加され、10 件になる
const STATIC_PAGE_COUNT = 10;

describe("sitemap", () => {
  describe("エントリ数の検証", () => {
    it("合計エントリ数が静的ページ + ガイド + use-cases + blog + 英語版であること", () => {
      const guideCount = getGuideSlugList().length;
      const useCaseCount = getUseCaseSlugList().length;
      const blogCount = getBlogSlugList().length;
      // qr_code_create-01z.7: 英語版 /en、/en/create、/en/guide/{slug}（現状 3 件）
      const enCount = 2 + getGuideSlugList("en").length;
      expect(enCount).toBe(3);
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
      { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
      { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
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

  describe("lastModifiedの検証", () => {
    it("全エントリにlastModifiedが存在すること", () => {
      const result = sitemap();
      result.forEach((entry) => {
        expect(entry.lastModified).toBeDefined();
      });
    });

    it("全エントリのlastModifiedがDateオブジェクトであること", () => {
      const result = sitemap();
      result.forEach((entry) => {
        expect(entry.lastModified).toBeInstanceOf(Date);
      });
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
