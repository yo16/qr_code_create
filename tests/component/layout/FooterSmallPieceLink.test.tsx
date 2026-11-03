import React from "react";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/Footer/Footer";
import { LOCALES } from "@/i18n/locales";

/** qr_code_create-1rq: フッターの Small Piece リンクが UTM 付きで、全言語で同じ形であること */

const EXPECTED_HREF =
  "https://smallpiece.jp/?utm_source=qr-code-create&utm_medium=referral&utm_content=footer";

describe.each([...LOCALES])("Footer の Small Piece リンク locale=%s", (locale) => {
  it("href が UTM 付きの URL に完全一致する", () => {
    render(<Footer locale={locale} />);
    expect(screen.getByRole("link", { name: "Small Piece" })).toHaveAttribute("href", EXPECTED_HREF);
  });

  it("UTM は source/medium/content のみで utm_campaign が無い", () => {
    render(<Footer locale={locale} />);
    const href = screen.getByRole("link", { name: "Small Piece" }).getAttribute("href") ?? "";
    const url = new URL(href);
    expect(url.origin).toBe("https://smallpiece.jp");
    expect(url.searchParams.get("utm_source")).toBe("qr-code-create");
    expect(url.searchParams.get("utm_medium")).toBe("referral");
    expect(url.searchParams.get("utm_content")).toBe("footer");
    expect([...url.searchParams.keys()].sort()).toEqual(["utm_content", "utm_medium", "utm_source"]);
  });

  it("新しいタブで開き、noopener noreferrer が付く", () => {
    render(<Footer locale={locale} />);
    const link = screen.getByRole("link", { name: "Small Piece" });
    expect(link).toHaveAttribute("target", "_blank");
    const rel = (link.getAttribute("rel") ?? "").split(/\s+/);
    expect(rel).toContain("noopener");
    expect(rel).toContain("noreferrer");
  });

  it("「Built by」が表示される", () => {
    const { container } = render(<Footer locale={locale} />);
    expect(container).toHaveTextContent("Built by Small Piece");
  });

  // qr_code_create-9ck 意図: コピーライトと Built by を 1 つの段落にまとめ、1 段で並べる
  it("1 段: リンクを含む段落に QR Code Create と Built by Small Piece の両方が入る", () => {
    render(<Footer locale={locale} />);
    const p = screen.getByRole("link", { name: "Small Piece" }).closest("p");
    expect(p).not.toBeNull();
    expect(p).toHaveTextContent("QR Code Create");
    expect(p).toHaveTextContent("Built by Small Piece");
  });

  // 意図: 中黒でつながず、コピーライトと Built by を別の要素に分ける（区切りは余白）
  it("1 段: 中黒でつながず、コピーライトと Built by を別の要素に分ける", () => {
    render(<Footer locale={locale} />);
    const p = screen.getByRole("link", { name: "Small Piece" }).closest("p");
    expect(p).not.toBeNull();
    const text = p?.textContent ?? "";
    expect(text).not.toContain("·");
    expect(text).not.toContain("・");
    expect(p?.children).toHaveLength(2);
    expect(p?.children[0].textContent).toBe(`© ${new Date().getFullYear()} QR Code Create`);
    expect(p?.children[1].textContent).toBe("Built by Small Piece");
    // 読み上げで語がくっつかないよう、間に空白がある
    expect(text).toMatch(/QR Code Create\s+Built by/);
  });

  // 意図: 年は直書きせず現在の年を使う
  it("1 段: 段落に現在の年を使った © が含まれる", () => {
    render(<Footer locale={locale} />);
    const text = screen.getByRole("link", { name: "Small Piece" }).closest("p")?.textContent ?? "";
    expect(text).toContain(`© ${new Date().getFullYear()} QR Code Create`);
  });
});
