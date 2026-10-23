import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ArticleCta } from "@/components/marketing/ArticleCta/ArticleCta";

/**
 * ArticleCta のテスト
 *
 * ガイド・用途別ページの本文末尾に置く「QRコードを作成する」CTA。
 * 検索流入ユーザーのツール到達率を上げるため、リンク先・文言・アクセシビリティ・
 * クリック計測（trackCtaClicked）を検証する。
 * 契約: ArticleCta({ href = "/create", location = "article_bottom", text = "QRコードを作成する" })
 */

jest.mock("next/link", () => {
  const MockLink = ({
    href,
    children,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

jest.mock("@/lib/analytics/events", () => ({
  trackCtaClicked: jest.fn(),
}));

const { trackCtaClicked } = jest.requireMock("@/lib/analytics/events") as {
  trackCtaClicked: jest.Mock;
};

describe("ArticleCta", () => {
  beforeEach(() => {
    trackCtaClicked.mockClear();
  });

  describe("描画", () => {
    it("既定で「QRコードを作成する」リンクが href=\"/create\" で描画されること", () => {
      // 意図: ガイドページでは props なしで使うため、既定の文言とリンク先が契約どおりであること。
      render(<ArticleCta />);
      const link = screen.getByRole("link", { name: "QRコードを作成する" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/create");
    });

    it("href を渡すとリンク先に反映されること", () => {
      // 意図: 用途別ページではプリセット付きの href を渡すため、props が反映されること。
      render(<ArticleCta href="/create?utm_source=poster&utm_medium=qr&preset=elegant" />);
      const link = screen.getByRole("link", { name: "QRコードを作成する" });
      expect(link).toHaveAttribute(
        "href",
        "/create?utm_source=poster&utm_medium=qr&preset=elegant"
      );
    });

    it("text を渡すとリンク文言に反映されること", () => {
      // 意図: 用途別ページでは「この設定でQRコードを作成する」のように文言を差し替えるため。
      render(<ArticleCta text="この設定でQRコードを作成する" />);
      expect(
        screen.getByRole("link", { name: "この設定でQRコードを作成する" })
      ).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "QRコードを作成する" })).not.toBeInTheDocument();
    });

    it("aside に aria-label「QRコード作成への案内」が付いていること", () => {
      // 意図: 本文と区別できる補足領域として、スクリーンリーダーに名前付きで公開されること。
      render(<ArticleCta />);
      expect(
        screen.getByRole("complementary", { name: "QRコード作成への案内" })
      ).toBeInTheDocument();
    });

    it("見出しテキストと補足テキストが表示されること", () => {
      // 意図: CTA の文言が契約どおりであること（コピー変更時に気づけるようにする）。
      render(<ArticleCta />);
      expect(
        screen.getByText("このページの内容でQRコードを作ってみましょう")
      ).toBeInTheDocument();
      expect(screen.getByText("無料・登録不要")).toBeInTheDocument();
    });
  });

  describe("クリック計測", () => {
    it("リンクをクリックすると trackCtaClicked が (\"QRコードを作成する\", \"article_bottom\") で呼ばれること", () => {
      // 意図: 既定の text と location（article_bottom）が計測に渡り、GA で既存 CTA と区別できること。
      render(<ArticleCta />);
      fireEvent.click(screen.getByRole("link", { name: "QRコードを作成する" }));
      expect(trackCtaClicked).toHaveBeenCalledTimes(1);
      expect(trackCtaClicked).toHaveBeenCalledWith("QRコードを作成する", "article_bottom");
    });

    it("location を渡すと第 2 引数に反映されること", () => {
      // 意図: 将来ページ中腹などに置いた場合に、配置場所ごとに計測を分けられること。
      render(<ArticleCta location="use_case_bottom" />);
      fireEvent.click(screen.getByRole("link", { name: "QRコードを作成する" }));
      expect(trackCtaClicked).toHaveBeenCalledWith("QRコードを作成する", "use_case_bottom");
    });

    it("text を渡すと第 1 引数（button_text）に反映されること", () => {
      // 意図: 文言を差し替えた CTA が GA 上でも差し替え後の文言で記録され、
      //       ガイド用と用途別用のクリックを区別できること。
      render(<ArticleCta text="この設定でQRコードを作成する" />);
      fireEvent.click(screen.getByRole("link", { name: "この設定でQRコードを作成する" }));
      expect(trackCtaClicked).toHaveBeenCalledWith(
        "この設定でQRコードを作成する",
        "article_bottom"
      );
    });

    it("描画しただけでは trackCtaClicked が呼ばれないこと", () => {
      // 意図: 表示時に誤って計測が飛び、クリック率が過大評価されないこと。
      render(<ArticleCta />);
      expect(trackCtaClicked).not.toHaveBeenCalled();
    });
  });
});
