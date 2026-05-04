import { buildMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";

const DEFAULT_SITE_URL = "https://qr-create.jp";

describe("buildMetadata", () => {
  describe("正常系: 基本的な返り値の検証", () => {
    const options = {
      title: "テストタイトル",
      description: "テスト説明文",
      path: "/test",
    };

    it("titleが返り値に含まれること", () => {
      const result = buildMetadata(options);
      expect(result.title).toBe(options.title);
    });

    it("descriptionが返り値に含まれること", () => {
      const result = buildMetadata(options);
      expect(result.description).toBe(options.description);
    });

    it("alternates.canonicalがフルURLで返ること", () => {
      const result = buildMetadata(options);
      expect(result.alternates?.canonical).toBe(`${DEFAULT_SITE_URL}/test`);
    });

    it("alternates.canonicalにSITE_URLが含まれること", () => {
      const result = buildMetadata(options);
      const canonical = result.alternates?.canonical as string;
      expect(canonical).toMatch(/^https?:\/\/.+\/test$/);
    });
  });

  describe("正常系: openGraphの検証", () => {
    const options = {
      title: "OGテストタイトル",
      description: "OG説明文",
      path: "/og-test",
    };

    it("openGraph.titleが正しいこと", () => {
      const result = buildMetadata(options);
      expect(result.openGraph?.title).toBe(options.title);
    });

    it("openGraph.descriptionが正しいこと", () => {
      const result = buildMetadata(options);
      expect(result.openGraph?.description).toBe(options.description);
    });

    it("openGraph.urlがフルURLで正しいこと", () => {
      const result = buildMetadata(options);
      expect(result.openGraph?.url).toBe(`${DEFAULT_SITE_URL}/og-test`);
    });

    it("openGraph.imagesが配列で定義されていること", () => {
      const result = buildMetadata(options);
      expect(Array.isArray(result.openGraph?.images)).toBe(true);
    });

    it("openGraph.imagesの最初の要素がurlを持つこと", () => {
      const result = buildMetadata(options);
      const images = result.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toBeDefined();
      expect(images[0].url).toMatch(/^https?:\/\/.+/);
    });

    it("localeが'ja_JP'であること", () => {
      const result = buildMetadata(options);
      expect(result.openGraph?.locale).toBe("ja_JP");
    });
  });

  describe("正常系: twitterの検証", () => {
    const options = {
      title: "Twitterテストタイトル",
      description: "Twitter説明文",
      path: "/twitter-test",
    };

    it("twitter.cardが'summary_large_image'であること", () => {
      const result = buildMetadata(options);
      expect(result.twitter?.card).toBe("summary_large_image");
    });

    it("twitter.titleが正しいこと", () => {
      const result = buildMetadata(options);
      expect(result.twitter?.title).toBe(options.title);
    });

    it("twitter.descriptionが正しいこと", () => {
      const result = buildMetadata(options);
      expect(result.twitter?.description).toBe(options.description);
    });
  });

  describe("正常系: ogImagePathの検証", () => {
    it("ogImagePath省略時にデフォルト画像パスが使われること", () => {
      const result = buildMetadata({
        title: "テスト",
        description: "テスト",
        path: "/",
      });
      const images = result.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toContain("/images/og/default.png");
    });

    it("ogImagePathを指定したときにそのパスが使われること", () => {
      const result = buildMetadata({
        title: "テスト",
        description: "テスト",
        path: "/",
        ogImagePath: "/images/og/custom.png",
      });
      const images = result.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toContain("/images/og/custom.png");
    });

    it("ogImagePathのURLがフルURLになっていること", () => {
      const result = buildMetadata({
        title: "テスト",
        description: "テスト",
        path: "/",
        ogImagePath: "/images/og/custom.png",
      });
      const images = result.openGraph?.images as Array<{ url: string }>;
      expect(images[0].url).toMatch(/^https?:\/\/.+\/images\/og\/custom\.png$/);
    });
  });

  describe("異常系/オプション: noIndexの検証", () => {
    it("noIndex=trueのときrobots.index=falseであること", () => {
      const result = buildMetadata({
        title: "テスト",
        description: "テスト",
        path: "/private",
        noIndex: true,
      });
      expect(result.robots).toBeDefined();
      const robots = result.robots as { index: boolean; follow: boolean };
      expect(robots.index).toBe(false);
    });

    it("noIndex=trueのときrobots.follow=falseであること", () => {
      const result = buildMetadata({
        title: "テスト",
        description: "テスト",
        path: "/private",
        noIndex: true,
      });
      const robots = result.robots as { index: boolean; follow: boolean };
      expect(robots.follow).toBe(false);
    });

    it("noIndex=falseのときrobotsがundefinedであること", () => {
      const result = buildMetadata({
        title: "テスト",
        description: "テスト",
        path: "/public",
        noIndex: false,
      });
      expect(result.robots).toBeUndefined();
    });

    it("noIndex省略時にrobotsがundefinedであること", () => {
      const result = buildMetadata({
        title: "テスト",
        description: "テスト",
        path: "/public",
      });
      expect(result.robots).toBeUndefined();
    });
  });
});

describe("PAGE_METADATA", () => {
  describe("ページ定義数の検証", () => {
    it("8ページ分が定義されていること", () => {
      const keys = Object.keys(PAGE_METADATA);
      expect(keys).toHaveLength(8);
    });

    it("home/create/faq/privacy/terms/guide/useCases/blogが定義されていること", () => {
      expect(PAGE_METADATA).toHaveProperty("home");
      expect(PAGE_METADATA).toHaveProperty("create");
      expect(PAGE_METADATA).toHaveProperty("faq");
      expect(PAGE_METADATA).toHaveProperty("privacy");
      expect(PAGE_METADATA).toHaveProperty("terms");
      expect(PAGE_METADATA).toHaveProperty("guide");
      expect(PAGE_METADATA).toHaveProperty("useCases");
      expect(PAGE_METADATA).toHaveProperty("blog");
    });
  });

  describe("各ページのtitle/description/path検証", () => {
    const pages = ["home", "create", "faq", "privacy", "terms", "guide", "useCases", "blog"] as const;

    it.each(pages)("%sページにtitleが定義されていること", (page) => {
      expect(PAGE_METADATA[page].title).toBeDefined();
      expect(PAGE_METADATA[page].title.length).toBeGreaterThan(0);
    });

    it.each(pages)("%sページにdescriptionが定義されていること", (page) => {
      expect(PAGE_METADATA[page].description).toBeDefined();
      expect(PAGE_METADATA[page].description.length).toBeGreaterThan(0);
    });

    it.each(pages)("%sページにpathが定義されていること", (page) => {
      expect(PAGE_METADATA[page].path).toBeDefined();
      expect(PAGE_METADATA[page].path).toMatch(/^\//);
    });
  });

  describe("noIndexフラグの検証", () => {
    it("privacyページにnoIndex=trueがあること", () => {
      expect(PAGE_METADATA.privacy.noIndex).toBe(true);
    });

    it("termsページにnoIndex=trueがあること", () => {
      expect(PAGE_METADATA.terms.noIndex).toBe(true);
    });

    it("homeページにnoIndexが設定されていないこと", () => {
      expect((PAGE_METADATA.home as { noIndex?: boolean }).noIndex).toBeUndefined();
    });

    it("createページにnoIndexが設定されていないこと", () => {
      expect((PAGE_METADATA.create as { noIndex?: boolean }).noIndex).toBeUndefined();
    });

    it("faqページにnoIndexが設定されていないこと", () => {
      expect((PAGE_METADATA.faq as { noIndex?: boolean }).noIndex).toBeUndefined();
    });

    it("guideページにnoIndexが設定されていないこと", () => {
      expect((PAGE_METADATA.guide as { noIndex?: boolean }).noIndex).toBeUndefined();
    });

    it("useCasesページにnoIndexが設定されていないこと", () => {
      expect((PAGE_METADATA.useCases as { noIndex?: boolean }).noIndex).toBeUndefined();
    });

    it("blogページにnoIndexが設定されていないこと", () => {
      expect((PAGE_METADATA.blog as { noIndex?: boolean }).noIndex).toBeUndefined();
    });
  });
});
