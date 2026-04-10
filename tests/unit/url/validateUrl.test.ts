import { validateUrl } from "@/lib/url/validateUrl";

describe("validateUrl", () => {
  describe("正常系", () => {
    it("有効なhttps URLでisValid: trueが返ること", () => {
      const result = validateUrl("https://example.com");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("有効なhttp URLでisValid: trueが返ること", () => {
      const result = validateUrl("http://example.com");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("パスやクエリパラメータを含むhttps URLでisValid: trueが返ること", () => {
      const result = validateUrl("https://example.com/path?query=value#hash");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("未入力（空文字）", () => {
    it("空文字でisValid: falseかつerrorがundefinedであること", () => {
      const result = validateUrl("");
      expect(result.isValid).toBe(false);
      expect(result.error).toBeUndefined();
    });
  });

  describe("異常系", () => {
    it("ftp://で始まるURLでisValid: falseかつエラーメッセージが返ること", () => {
      const result = validateUrl("ftp://example.com");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("有効なURLを入力してください");
    });

    it("プロトコルなしの文字列でisValid: falseかつエラーメッセージが返ること", () => {
      const result = validateUrl("example.com");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("有効なURLを入力してください");
    });

    it("不正な形式（'not a url'）でisValid: falseかつエラーメッセージが返ること", () => {
      const result = validateUrl("not a url");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("有効なURLを入力してください");
    });

    it("スペースのみの入力でisValid: falseかつエラーメッセージが返ること", () => {
      const result = validateUrl("   ");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("有効なURLを入力してください");
    });

    it("mailto:スキームでisValid: falseかつエラーメッセージが返ること", () => {
      const result = validateUrl("mailto:user@example.com");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("有効なURLを入力してください");
    });

    it("\"https://\"のみ（ホストなし）でcatchブランチに到達しisValid: falseかつエラーメッセージが返ること", () => {
      const result = validateUrl("https://");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("有効なURLを入力してください");
    });

    it("スペースを含むURL（\"https://exam ple.com\"）でcatchブランチに到達しisValid: falseかつエラーメッセージが返ること", () => {
      const result = validateUrl("https://exam ple.com");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("有効なURLを入力してください");
    });
  });

  describe("境界値", () => {
    it("1000文字程度の非常に長い有効URLでisValid: trueが返ること", () => {
      const longPath = "a".repeat(970);
      const longUrl = `https://example.com/${longPath}`;
      const result = validateUrl(longUrl);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
