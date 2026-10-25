import React from "react";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/Footer/Footer";
import { ja } from "@/i18n/ja";

// フラグ OFF（posterPage=false）に戻したとき、ja のフッターにも /poster のリンクを出さない（qr_code_create-b4m）。
// jest.mock はファイル単位で固定されるため、フラグ ON（既定）の検証は FooterLocale.test.tsx に分けている。
jest.mock("@/lib/constants/features", () => ({
  FEATURE_FLAGS: { posterPage: false },
}));

describe("Footer（フラグ OFF）", () => {
  it("ja でも「印刷用ポスター」のリンクが出ないこと", () => {
    const { container } = render(<Footer locale="ja" />);
    expect(container.querySelector('a[href="/poster"]')).toBeNull();
    expect(screen.queryByText(ja.footer.poster)).toBeNull();
  });

  it("ほかのリンク（FAQ・お問い合わせ）は変わらず出ること", () => {
    render(<Footer locale="ja" />);
    expect(screen.getByRole("link", { name: ja.footer.faq })).toHaveAttribute("href", "/faq");
    expect(screen.getByRole("link", { name: ja.footer.contact })).toHaveAttribute("href", "/contact");
  });
});
