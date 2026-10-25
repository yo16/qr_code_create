import { sanitizeUrl } from "@/components/poster/MarkdownRenderer/MarkdownRenderer";

// リンク先の許可リスト（http / https / mailto）。XSS 対策の要なので回避パターンを網羅する。
describe("sanitizeUrl", () => {
  describe("通すもの", () => {
    it.each([
      ["http", "http://example.com/a?b=1"],
      ["https", "https://example.com"],
      ["mailto", "mailto:info@example.com"],
      ["大文字の HTTPS", "HTTPS://example.com"],
    ])("%s のリンクはそのまま返すこと", (_name, url) => {
      expect(sanitizeUrl(url)).toBe(url);
    });
  });

  describe("拒否するもの（空文字を返す）", () => {
    it.each([
      ["javascript:", "javascript:alert(1)"],
      ["大文字の JAVASCRIPT:", "JAVASCRIPT:alert(1)"],
      ["大文字小文字混在", "JaVaScRiPt:alert(1)"],
      ["先頭に空白", " javascript:alert(1)"],
      ["途中にタブ", "java\tscript:alert(1)"],
      ["途中に改行", "java\nscript:alert(1)"],
      ["data:", "data:text/html,<script>alert(1)</script>"],
      ["vbscript:", "vbscript:msgbox(1)"],
      ["file:", "file:///etc/passwd"],
      ["空文字", ""],
      ["エンティティ表記 javascript&colon;", "javascript&colon;alert(1)"],
      ["制御文字 \\u0001 が先頭", "\u0001javascript:alert(1)"],
    ])("%s は空文字になること", (_name, url) => {
      expect(sanitizeUrl(url)).toBe("");
    });
  });

  // 仕様: 前後の空白を除いたあと、制御文字・空白・%09/%0a/%0d を含むものは拒否し、
  // http:// / https:// / mailto: で始まる絶対 URL だけを通す。相対 URL やスキームなしは空文字。
  describe("絶対 URL 以外は拒否する", () => {
    it.each([
      ["相対パス", "/path/to"],
      ["アンカー", "#anchor"],
      ["プロトコル相対 URL", "//evil.com"],
      ["スキームなしのドメイン", "www.example.com"],
      ["%0a を含む URL", "https://example.com/a%0ab"],
      ["大文字の %0A を含む URL", "https://example.com/a%0Ab"],
      ["%09 を含む URL", "https://example.com/a%09b"],
      ["%0d を含む URL", "https://example.com/a%0db"],
    ])("%s は空文字になること", (_name, url) => {
      expect(sanitizeUrl(url)).toBe("");
    });

    it("前後に空白があっても、除いた結果が許可 URL なら通すこと（空文字にならない）", () => {
      // 現状の実装は判定にだけ trim を使い、元の文字列をそのまま返す
      expect(sanitizeUrl("  https://example.com  ").trim()).toBe("https://example.com");
    });

    it("途中に空白を含む URL は拒否すること", () => {
      expect(sanitizeUrl("https://example.com/a b")).toBe("");
    });
  });
});
