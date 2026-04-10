import { buildUtmUrl } from "@/lib/url/buildUtmUrl";

describe("buildUtmUrl", () => {
  describe("正常系", () => {
    it("URL + 全UTMパラメータで正しいURLが生成されること", () => {
      const result = buildUtmUrl("https://example.com", {
        source: "google",
        medium: "cpc",
        campaign: "spring_sale",
        term: "keyword",
        content: "banner",
      });
      const url = new URL(result);
      expect(url.searchParams.get("utm_source")).toBe("google");
      expect(url.searchParams.get("utm_medium")).toBe("cpc");
      expect(url.searchParams.get("utm_campaign")).toBe("spring_sale");
      expect(url.searchParams.get("utm_term")).toBe("keyword");
      expect(url.searchParams.get("utm_content")).toBe("banner");
    });

    it("sourceのみ指定した場合にutm_sourceのみ付与されること", () => {
      const result = buildUtmUrl("https://example.com", {
        source: "google",
      });
      const url = new URL(result);
      expect(url.searchParams.get("utm_source")).toBe("google");
      expect(url.searchParams.get("utm_medium")).toBeNull();
      expect(url.searchParams.get("utm_campaign")).toBeNull();
      expect(url.searchParams.get("utm_term")).toBeNull();
      expect(url.searchParams.get("utm_content")).toBeNull();
    });

    it("source/mediumのみ指定した場合にその2つのみ付与されること", () => {
      const result = buildUtmUrl("https://example.com", {
        source: "newsletter",
        medium: "email",
      });
      const url = new URL(result);
      expect(url.searchParams.get("utm_source")).toBe("newsletter");
      expect(url.searchParams.get("utm_medium")).toBe("email");
      expect(url.searchParams.get("utm_campaign")).toBeNull();
    });

    it("既存のクエリパラメータがあるURLにUTMパラメータが追加されること", () => {
      const result = buildUtmUrl("https://example.com/path?foo=bar", {
        source: "google",
        campaign: "test",
      });
      const url = new URL(result);
      expect(url.searchParams.get("foo")).toBe("bar");
      expect(url.searchParams.get("utm_source")).toBe("google");
      expect(url.searchParams.get("utm_campaign")).toBe("test");
    });
  });

  describe("異常系/境界値", () => {
    it("baseUrlが空文字のとき空文字が返ること", () => {
      const result = buildUtmUrl("", { source: "google" });
      expect(result).toBe("");
    });

    it("不正なURLのときbaseUrlがそのまま返ること", () => {
      const result = buildUtmUrl("not-a-valid-url", { source: "google" });
      expect(result).toBe("not-a-valid-url");
    });

    it("UTMパラメータが全て空のときbaseUrlがそのまま返ること", () => {
      const result = buildUtmUrl("https://example.com", {
        source: "",
        medium: "",
        campaign: "",
        term: "",
        content: "",
      });
      expect(result).toBe("https://example.com/");
    });

    it("UTMパラメータをすべて省略したときbaseUrlがそのまま返ること", () => {
      const result = buildUtmUrl("https://example.com", {});
      expect(result).toBe("https://example.com/");
    });

    it("UTMパラメータの値にスペースが含まれる場合エンコードされること", () => {
      const result = buildUtmUrl("https://example.com", {
        source: "my source",
        campaign: "spring sale",
      });
      expect(result).toContain("utm_source=my+source");
      expect(result).toContain("utm_campaign=spring+sale");
    });

    it("UTMパラメータの値がスペースのみの場合は付与されないこと", () => {
      const result = buildUtmUrl("https://example.com", {
        source: "   ",
        medium: "email",
      });
      const url = new URL(result);
      expect(url.searchParams.get("utm_source")).toBeNull();
      expect(url.searchParams.get("utm_medium")).toBe("email");
    });
  });
});
