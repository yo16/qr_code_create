import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";

describe("getGuide", () => {
  describe("正常系", () => {
    it("getGuide('sample')でGuideContentが返ること", () => {
      const result = getGuide("sample");
      expect(result).not.toBeNull();
    });

    it("返り値のtitleが'サンプルガイド'であること", () => {
      const result = getGuide("sample");
      expect(result?.title).toBe("サンプルガイド");
    });

    it("返り値にtitle, description, date, content, slugが含まれること", () => {
      const result = getGuide("sample");
      expect(result).not.toBeNull();
      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("description");
      expect(result).toHaveProperty("date");
      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("slug");
    });

    it("返り値のslugが引数と一致すること", () => {
      const result = getGuide("sample");
      expect(result?.slug).toBe("sample");
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

    it("返り値に'sample'が含まれること", () => {
      const result = getGuideSlugList();
      expect(result).toContain("sample");
    });
  });
});
