import React from "react";
import { render, screen } from "@testing-library/react";
import GuideIndexPage from "@/app/(marketing)/guide/page";

jest.mock("@/lib/content/getAllGuides", () => ({
  getAllGuides: jest.fn(),
}));

jest.mock("next/link", () => {
  const MockLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

const { getAllGuides } = jest.requireMock("@/lib/content/getAllGuides") as { getAllGuides: jest.Mock };

const mockGuides = [
  {
    slug: "utm-parameters",
    title: "UTMパラメータとは？",
    description: "UTMパラメータの基本を解説します。",
    date: "2024-01-01",
    order: 1,
  },
  {
    slug: "effective-qr-usage",
    title: "QRコードの効果的な使い方",
    description: "QRコードを最大限に活用する方法を紹介します。",
    date: "2024-01-10",
    order: 2,
  },
  {
    slug: "design-tips",
    title: "QRコードデザインのコツ",
    description: "見栄えの良いQRコードを作るためのデザインTips。",
    date: "2024-01-20",
    order: 3,
  },
];

describe("GuideIndexPage", () => {
  beforeEach(() => {
    getAllGuides.mockReturnValue(mockGuides);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("ページが正常にレンダリングされること", () => {
    it("エラーなくレンダリングできること", () => {
      expect(() => render(<GuideIndexPage />)).not.toThrow();
    });
  });

  describe("見出しの表示", () => {
    it("「使い方ガイド」のh1見出しが表示されること", () => {
      render(<GuideIndexPage />);
      expect(screen.getByRole("heading", { level: 1, name: "使い方ガイド" })).toBeInTheDocument();
    });
  });

  describe("記事カードの表示", () => {
    it("各ガイド記事のタイトルが表示されること", () => {
      render(<GuideIndexPage />);
      expect(screen.getByText("UTMパラメータとは？")).toBeInTheDocument();
      expect(screen.getByText("QRコードの効果的な使い方")).toBeInTheDocument();
      expect(screen.getByText("QRコードデザインのコツ")).toBeInTheDocument();
    });

    it("各リンクが /guide/{slug} 形式のhrefを持つこと", () => {
      render(<GuideIndexPage />);
      const links = screen.getAllByRole("link");
      const guideLinks = links.filter((link) => link.getAttribute("href")?.startsWith("/guide/"));
      expect(guideLinks).toHaveLength(3);
      expect(guideLinks[0]).toHaveAttribute("href", "/guide/utm-parameters");
      expect(guideLinks[1]).toHaveAttribute("href", "/guide/effective-qr-usage");
      expect(guideLinks[2]).toHaveAttribute("href", "/guide/design-tips");
    });
  });

  describe("ComingSoonPageが表示されないこと", () => {
    it("「準備中」テキストが表示されないこと", () => {
      render(<GuideIndexPage />);
      expect(screen.queryByText("準備中")).not.toBeInTheDocument();
    });
  });

  describe("記事が0件の場合", () => {
    it("記事が0件でもh1見出しは表示されること", () => {
      getAllGuides.mockReturnValue([]);
      render(<GuideIndexPage />);
      expect(screen.getByRole("heading", { level: 1, name: "使い方ガイド" })).toBeInTheDocument();
    });
  });
});
