import React from "react";
import { render, screen } from "@testing-library/react";
import GuideIndexPage from "@/app/(marketing)/guide/page";
import UseCasesIndexPage from "@/app/(marketing)/use-cases/page";
import BlogIndexPage from "@/app/(marketing)/blog/page";

jest.mock("next/link", () => {
  const MockLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("GuideIndexPage", () => {
  it("「使い方ガイド」タイトルが表示されること", () => {
    render(<GuideIndexPage />);
    expect(screen.getByRole("heading", { level: 1, name: "使い方ガイド" })).toBeInTheDocument();
  });

  it("「QRコードを作成する」リンクが表示されること", () => {
    render(<GuideIndexPage />);
    expect(screen.getByRole("link", { name: "QRコードを作成する" })).toBeInTheDocument();
  });

  it("「QRコードを作成する」リンクが/createを指していること", () => {
    render(<GuideIndexPage />);
    const link = screen.getByRole("link", { name: "QRコードを作成する" });
    expect(link).toHaveAttribute("href", "/create");
  });

  it("「準備中」バッジが表示されること", () => {
    render(<GuideIndexPage />);
    expect(screen.getByText("準備中")).toBeInTheDocument();
  });
});

describe("UseCasesIndexPage", () => {
  it("「用途別QRコード」タイトルが表示されること", () => {
    render(<UseCasesIndexPage />);
    expect(screen.getByRole("heading", { level: 1, name: "用途別QRコード" })).toBeInTheDocument();
  });

  it("「QRコードを作成する」リンクが表示されること", () => {
    render(<UseCasesIndexPage />);
    expect(screen.getByRole("link", { name: "QRコードを作成する" })).toBeInTheDocument();
  });

  it("「QRコードを作成する」リンクが/createを指していること", () => {
    render(<UseCasesIndexPage />);
    const link = screen.getByRole("link", { name: "QRコードを作成する" });
    expect(link).toHaveAttribute("href", "/create");
  });

  it("「準備中」バッジが表示されること", () => {
    render(<UseCasesIndexPage />);
    expect(screen.getByText("準備中")).toBeInTheDocument();
  });
});

describe("BlogIndexPage", () => {
  it("「ブログ」タイトルが表示されること", () => {
    render(<BlogIndexPage />);
    expect(screen.getByRole("heading", { level: 1, name: "ブログ" })).toBeInTheDocument();
  });

  it("「QRコードを作成する」リンクが表示されること", () => {
    render(<BlogIndexPage />);
    expect(screen.getByRole("link", { name: "QRコードを作成する" })).toBeInTheDocument();
  });

  it("「QRコードを作成する」リンクが/createを指していること", () => {
    render(<BlogIndexPage />);
    const link = screen.getByRole("link", { name: "QRコードを作成する" });
    expect(link).toHaveAttribute("href", "/create");
  });

  it("「準備中」バッジが表示されること", () => {
    render(<BlogIndexPage />);
    expect(screen.getByText("準備中")).toBeInTheDocument();
  });
});
