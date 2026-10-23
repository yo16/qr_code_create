import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";

describe("getGuide", () => {
  describe("正常系", () => {
    it("getGuide('utm-parameters')でGuideContentが返ること", () => {
      const result = getGuide("utm-parameters");
      expect(result).not.toBeNull();
    });

    it("返り値のtitleが設定されたものであること", () => {
      const result = getGuide("utm-parameters");
      expect(result?.title).toBeTruthy();
      expect(typeof result?.title).toBe("string");
    });

    it("返り値にtitle, description, date, content, slugが含まれること", () => {
      const result = getGuide("utm-parameters");
      expect(result).not.toBeNull();
      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("description");
      expect(result).toHaveProperty("date");
      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("slug");
    });

    it("返り値のslugが引数と一致すること", () => {
      const result = getGuide("utm-parameters");
      expect(result?.slug).toBe("utm-parameters");
    });

    // 意図: howto は任意項目。frontmatter に howto を持たないガイド（utm-parameters）では
    //       getGuide の戻り値の howto が undefined であり、空配列や null に正規化されないこと
    //       （ページ側は howto の有無で HowTo スキーマの出力を切り替える）。
    it("howto を持たないガイド（utm-parameters）では返り値の howto が undefined であること", () => {
      const result = getGuide("utm-parameters");
      expect(result).not.toBeNull();
      expect(result?.howto).toBeUndefined();
    });
  });

  describe("異常系", () => {
    it("getGuide('nonexistent')でnullが返ること", () => {
      const result = getGuide("nonexistent");
      expect(result).toBeNull();
    });
  });
});

describe("getGuideSlugList", () => {
  describe("正常系", () => {
    it("文字列配列を返すこと", () => {
      const result = getGuideSlugList();
      expect(Array.isArray(result)).toBe(true);
      result.forEach((slug) => {
        expect(typeof slug).toBe("string");
      });
    });

    it("返り値に'utm-parameters'が含まれること", () => {
      const result = getGuideSlugList();
      expect(result).toContain("utm-parameters");
    });
  });
});
