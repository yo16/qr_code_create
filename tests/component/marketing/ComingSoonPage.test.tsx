import React from "react";
import { render, screen } from "@testing-library/react";
import { ComingSoonPage } from "@/components/marketing/ComingSoonPage";

jest.mock("next/link", () => {
  const MockLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("ComingSoonPage", () => {
  const defaultProps = {
    title: "テストタイトル",
    description: "テスト説明文です。",
  };

  describe("title propのレンダリング", () => {
    it("title propがh1として表示されること", () => {
      render(<ComingSoonPage {...defaultProps} />);
      expect(screen.getByRole("heading", { level: 1, name: "テストタイトル" })).toBeInTheDocument();
    });

    it("title propに別の値を渡したときその値が表示されること", () => {
      render(<ComingSoonPage title="別のタイトル" description="説明" />);
      expect(screen.getByRole("heading", { level: 1, name: "別のタイトル" })).toBeInTheDocument();
    });
  });

  describe("description propのレンダリング", () => {
    it("description propが表示されること", () => {
      render(<ComingSoonPage {...defaultProps} />);
      expect(screen.getByText("テスト説明文です。")).toBeInTheDocument();
    });

    it("description propに別の値を渡したときその値が表示されること", () => {
      render(<ComingSoonPage title="タイトル" description="別の説明文" />);
      expect(screen.getByText("別の説明文")).toBeInTheDocument();
    });
  });

  describe("「準備中」バッジ", () => {
    it("「準備中」テキストが表示されること", () => {
      render(<ComingSoonPage {...defaultProps} />);
      expect(screen.getByText("準備中")).toBeInTheDocument();
    });
  });

  describe("「QRコードを作成する」リンク", () => {
    it("「QRコードを作成する」テキストのリンクが表示されること", () => {
      render(<ComingSoonPage {...defaultProps} />);
      expect(screen.getByRole("link", { name: "QRコードを作成する" })).toBeInTheDocument();
    });

    it("「QRコードを作成する」リンクが/createを指していること", () => {
      render(<ComingSoonPage {...defaultProps} />);
      const link = screen.getByRole("link", { name: "QRコードを作成する" });
      expect(link).toHaveAttribute("href", "/create");
    });
  });

  describe("「トップに戻る」リンク", () => {
    it("「トップに戻る」テキストのリンクが表示されること", () => {
      render(<ComingSoonPage {...defaultProps} />);
      expect(screen.getByRole("link", { name: "トップに戻る" })).toBeInTheDocument();
    });

    it("「トップに戻る」リンクが/を指していること", () => {
      render(<ComingSoonPage {...defaultProps} />);
      const link = screen.getByRole("link", { name: "トップに戻る" });
      expect(link).toHaveAttribute("href", "/");
    });
  });
});
