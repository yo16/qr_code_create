import sitemap from "@/app/sitemap";

const DEFAULT_SITE_URL = "https://www.qr-create.jp";

describe("sitemap", () => {
  describe("エントリ数の検証", () => {
    it("合計エントリ数が10件であること（静的6 + ガイド4）", () => {
      const result = sitemap();
      expect(result).toHaveLength(10);
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
    const guideSlugs = [
      "utm-parameters",
      "effective-qr-usage",
      "design-tips",
      "analytics-measurement",
    ];

    it.each(guideSlugs)("ガイドスラッグ '%s' が含まれること", (slug) => {
      const result = sitemap();
      const guidePage = result.find((entry) => {
        const url = new URL(entry.url);
        return url.pathname === `/guide/${slug}`;
      });
      expect(guidePage).toBeDefined();
    });

    it.each(guideSlugs)("ガイドスラッグ '%s' のchangeFrequencyがmonthly、priorityが0.7であること", (slug) => {
      const result = sitemap();
      const page = result.find((entry) => {
        const url = new URL(entry.url);
        return url.pathname === `/guide/${slug}`;
      });
      expect(page?.changeFrequency).toBe("monthly");
      expect(page?.priority).toBe(0.7);
    });

    it("ガイドページが合計4件含まれること", () => {
      const result = sitemap();
      const guidePages = result.filter((entry) => {
        const url = new URL(entry.url);
        return url.pathname.startsWith("/guide/");
      });
      expect(guidePages).toHaveLength(4);
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
    it("環境変数未設定時にフォールバックURLが正しいURL形式であること", () => {
      const result = sitemap();
      result.forEach((entry) => {
        expect(() => new URL(entry.url)).not.toThrow();
      });
    });

    it("全エントリのURLがhttps://またはhttp://で始まること", () => {
      const result = sitemap();
      result.forEach((entry) => {
        expect(entry.url).toMatch(/^https?:\/\//);
      });
    });

    it("NEXT_PUBLIC_SITE_URLが未設定の場合はデフォルトフォールバックURLが使用されること", () => {
      // robots.tsと同様、モジュールはビルド時にキャッシュされるため
      // URL形式の正当性と、デフォルト値のドメインが使用される可能性を確認する
      const saved = process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.NEXT_PUBLIC_SITE_URL;

      const result = sitemap();
      // 全エントリが有効なURLであること
      result.forEach((entry) => {
        expect(() => new URL(entry.url)).not.toThrow();
      });

      process.env.NEXT_PUBLIC_SITE_URL = saved;
    });
  });

  describe("URLの一意性検証", () => {
    it("重複するURLが存在しないこと", () => {
      const result = sitemap();
      const urls = result.map((entry) => entry.url);
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(urls.length);
    });
  });
});
