import sitemap from "@/app/sitemap";
import { getGuideSlugList } from "@/lib/content/getGuide";
import { getUseCaseSlugList } from "@/lib/content/getUseCase";

const STATIC_PAGE_COUNT = 7; // /, /create, /guide, /use-cases, /faq, /privacy, /terms

describe("sitemap", () => {
  describe("エントリ数の検証", () => {
    it("合計エントリ数が静的ページ + ガイド + use-cases であること", () => {
      const guideCount = getGuideSlugList().length;
      const useCaseCount = getUseCaseSlugList().length;
      const expectedTotal = STATIC_PAGE_COUNT + guideCount + useCaseCount;
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
      { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
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
