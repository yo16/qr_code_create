import React from "react";
import { render } from "@testing-library/react";
import { MarkdownRenderer } from "@/components/poster/MarkdownRenderer/MarkdownRenderer";

// このテストは実物の react-markdown / remark-gfm で変換する（jest.config.ts の markdown-real プロジェクトで実行）。
// 通常設定ではモックに差し替わるため、allowedElements の効果はここでしか確かめられない。

function renderMd(source: string) {
  const { container } = render(<MarkdownRenderer source={source} />);
  return container;
}

describe("MarkdownRenderer（実物の react-markdown）", () => {
  describe("許可された記法", () => {
    it("見出し・太字・斜体・打ち消しが対応する要素になること", () => {
      const c = renderMd("## 見出し\n\n**太** *斜* ~~消~~");
      expect(c.querySelector("h2")?.textContent).toBe("見出し");
      expect(c.querySelector("strong")?.textContent).toBe("太");
      expect(c.querySelector("em")?.textContent).toBe("斜");
      expect(c.querySelector("del")?.textContent).toBe("消");
    });

    it("リスト・引用・水平線・コードが対応する要素になること", () => {
      const c = renderMd("- a\n- b\n\n1. x\n\n> 引用\n\n---\n\n`code`");
      expect(c.querySelectorAll("ul li")).toHaveLength(2);
      expect(c.querySelector("ol li")).not.toBeNull();
      expect(c.querySelector("blockquote")).not.toBeNull();
      expect(c.querySelector("hr")).not.toBeNull();
      expect(c.querySelector("code")?.textContent).toBe("code");
    });

    it("GFM のテーブルが table 要素になること", () => {
      const c = renderMd("| a | b |\n| - | - |\n| 1 | 2 |");
      expect(c.querySelector("table thead th")).not.toBeNull();
      expect(c.querySelector("table tbody td")).not.toBeNull();
    });

    it("https リンクは新しいタブで noopener 付きの a 要素になること", () => {
      const c = renderMd("[x](https://example.com)");
      const a = c.querySelector("a");
      expect(a).toHaveAttribute("href", "https://example.com");
      expect(a).toHaveAttribute("target", "_blank");
      expect(a?.getAttribute("rel")).toContain("noopener");
    });
  });

  describe("禁止された要素", () => {
    it("<script> が要素として出力されないこと", () => {
      const c = renderMd("<script>alert(1)</script>");
      expect(c.querySelector("script")).toBeNull();
    });

    it("<img onerror> が要素として出力されないこと", () => {
      const c = renderMd("<img src=x onerror=alert(1)>");
      expect(c.querySelector("img")).toBeNull();
      expect(c.innerHTML).not.toMatch(/<[^>]*onerror/i);
    });

    it("Markdown の画像記法 ![](x) が img 要素にならないこと", () => {
      const c = renderMd("![alt](https://example.com/a.png)");
      expect(c.querySelector("img")).toBeNull();
    });

    it("<iframe> が要素として出力されないこと", () => {
      const c = renderMd('<iframe src="https://example.com"></iframe>');
      expect(c.querySelector("iframe")).toBeNull();
    });

    it("[x](javascript:alert(1)) が a 要素にならず、文字だけが残ること", () => {
      const c = renderMd("[x](javascript:alert(1))");
      expect(c.querySelector("a")).toBeNull();
      expect(c.innerHTML).not.toContain("javascript:");
      expect(c.textContent).toContain("x");
    });
  });
});

// レビュー指摘による追加。javascript: スキームの迂回経路をまとめて確かめる。
// 仕様: どの経路でも a 要素の href に javascript: が出ないこと。
function hrefs(c: HTMLElement): string[] {
  return Array.from(c.querySelectorAll("a")).map((a) => a.getAttribute("href") ?? "");
}

describe("MarkdownRenderer（実物の react-markdown）: リンクの迂回経路", () => {
  it("参照形式のリンク [x][1] + [1]: javascript:... で a 要素が出ず javascript: も残らないこと", () => {
    const c = renderMd("[x][1]\n\n[1]: javascript:alert(1)");
    expect(c.querySelector("a")).toBeNull();
    expect(c.innerHTML).not.toContain("javascript:");
  });

  describe("自動リンク", () => {
    it("<javascript:alert(1)> は a 要素にならないこと", () => {
      const c = renderMd("<javascript:alert(1)>");
      expect(c.querySelector("a")).toBeNull();
      expect(c.innerHTML).not.toMatch(/href="javascript:/i);
    });

    it("<https://example.com> は a 要素になること", () => {
      const c = renderMd("<https://example.com>");
      expect(hrefs(c)).toEqual(["https://example.com"]);
    });

    it("GFM の素の URL https://example.com は a 要素になる（現状の挙動の固定）", () => {
      const c = renderMd("https://example.com");
      expect(hrefs(c)).toEqual(["https://example.com"]);
    });

    it("GFM の www.example.com は http:// 付きの a 要素になる（現状の挙動の固定）", () => {
      const c = renderMd("www.example.com");
      expect(hrefs(c)).toEqual(["http://www.example.com"]);
    });
  });

  it("生 HTML の <a href=javascript:...> は a 要素にならないか、href に javascript: を含まないこと", () => {
    const c = renderMd('<a href="javascript:alert(1)">x</a>');
    // 生 HTML は解釈されず、原文が文字として（エスケープされて）表示される。要素や属性にならなければ安全
    expect(c.querySelector("a")).toBeNull();
    expect(c.querySelector("[href]")).toBeNull();
    hrefs(c).forEach((h) => expect(h.toLowerCase()).not.toContain("javascript:"));
  });

  describe("文字参照・制御文字による迂回", () => {
    it.each([
      ["10 進の文字参照", "[x](&#106;avascript:alert(1))"],
      ["16 進の文字参照", "[x](&#x6A;avascript:alert(1))"],
      ["改行の文字参照", "[x](java&#10;script:alert(1))"],
      ["山括弧で囲んだ宛先", "[x](<javascript:alert(1)>)"],
    ])("%s でも a 要素が出ず href に javascript: が出ないこと", (_name, src) => {
      const c = renderMd(src);
      expect(c.querySelector("a")).toBeNull();
      expect(c.innerHTML).not.toMatch(/href="[^"]*javascript:/i);
      expect(c.querySelector("[href]")).toBeNull();
    });
  });
});

describe("MarkdownRenderer（実物の react-markdown）: 禁止要素の扱い", () => {
  it("<script> のテキストは要素にならず、textContent に残るかどうかを固定する", () => {
    const c = renderMd("<script>alert(1)</script>");
    expect(c.querySelector("script")).toBeNull();
    // 生 HTML は解釈されず、原文が文字として表示される（現状の挙動）
    expect(c.textContent).toContain("alert(1)");
  });

  it("<img onerror> は要素にならず、原文が文字として残る（現状の挙動）", () => {
    const c = renderMd("<img src=x onerror=alert(1)>");
    expect(c.querySelector("img")).toBeNull();
    expect(c.textContent).toContain("onerror");
  });

  it.each([
    ["style", "<style>body{display:none}</style>"],
    ["svg", "<svg onload=alert(1)></svg>"],
    ["form", '<form action="https://evil.example"><input name=a></form>'],
    ["input", "<input type=text>"],
  ])("<%s> は要素にならないこと", (tag, src) => {
    const c = renderMd(src);
    expect(c.querySelector(tag)).toBeNull();
    expect(c.querySelector("[onload],[onerror],[action]")).toBeNull();
  });

  it("[x](mailto:a@example.com) は a 要素になり、target と rel が付くこと", () => {
    const a = renderMd("[x](mailto:a@example.com)").querySelector("a");
    expect(a).toHaveAttribute("href", "mailto:a@example.com");
    expect(a).toHaveAttribute("target", "_blank");
    expect(a?.getAttribute("rel")).toContain("noopener");
  });
});
