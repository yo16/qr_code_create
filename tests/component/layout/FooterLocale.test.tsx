import React from "react";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/Footer/Footer";
import { en } from "@/i18n/en";
import { ja } from "@/i18n/ja";

/**
 * Footer の locale 別リンク（qr_code_create-01z.4）。
 * en は英語版の無い規約系を日本語ページへ「(Japanese)」付きでリンクし、注記を出す。FAQ は出さない。
 */

describe("Footer locale=en", () => {
  // 意図: 3 リンクが日本語ページを指し、hreflang="ja" が付く
  it.each([
    ["Privacy policy (Japanese)", "/privacy"],
    ["Terms of service (Japanese)", "/terms"],
    ["Contact (Japanese)", "/contact"],
  ])("「%s」が %s を指し hreflang=ja", (name, href) => {
    render(<Footer locale="en" />);
    const link = screen.getByRole("link", { name });
    expect(link).toHaveAttribute("href", href);
    expect(link).toHaveAttribute("hreflang", "ja");
  });

  // 意図: 規約が日本語だけだという注記がある
  it("日本語のみの注記を表示する", () => {
    render(<Footer locale="en" />);
    expect(screen.getByText(en.footer.japaneseOnlyNote)).toBeInTheDocument();
  });

  // 意図: 英語版の無い FAQ への導線は出さない
  it("FAQ リンクが無い", () => {
    const { container } = render(<Footer locale="en" />);
    expect(screen.queryByRole("link", { name: "FAQ" })).toBeNull();
    expect(container.querySelector('a[href="/faq"]')).toBeNull();
  });
});

describe("Footer locale=ja", () => {
  // 意図: ja は従来どおり 4 リンク（FAQ を含む）で、hreflang も注記も無い
  it("プライバシー・利用規約・FAQ・お問い合わせの 4 リンク", () => {
    const { container } = render(<Footer locale="ja" />);
    for (const [name, href] of [
      [ja.footer.privacy, "/privacy"],
      [ja.footer.terms, "/terms"],
      [ja.footer.faq, "/faq"],
      [ja.footer.contact, "/contact"],
    ]) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", href);
      expect(link).not.toHaveAttribute("hreflang");
    }
    expect(container).not.toHaveTextContent(en.footer.japaneseOnlyNote);
  });
});
