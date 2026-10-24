// NotFoundContent（qr_code_create-01z.1）: (ja)/not-found・en/not-found・global-not-found が共有する 404 本文のテスト。
import React from "react";
import { render, screen } from "@testing-library/react";
import { NotFoundContent } from "@/components/layout/NotFoundContent";

describe("NotFoundContent", () => {
  it("locale=ja で h1「ページが見つかりません」とトップ（/）へのリンクを表示すること", () => {
    render(<NotFoundContent locale="ja" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("ページが見つかりません");
    const link = screen.getByRole("link", { name: "トップページへ戻る" });
    expect(link).toHaveAttribute("href", "/");
  });

  it("locale=en で h1「Page not found」と /en へのリンクを表示すること", () => {
    render(<NotFoundContent locale="en" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Page not found");
    const link = screen.getByRole("link", { name: "Back to the home page" });
    expect(link).toHaveAttribute("href", "/en");
  });

  it("locale=en では日本語の文言を含まないこと", () => {
    const { container } = render(<NotFoundContent locale="en" />);
    expect(container.textContent).not.toContain("ページが見つかりません");
  });

  it("h1 は 1 つだけであること", () => {
    render(<NotFoundContent locale="ja" />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
