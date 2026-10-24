import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileNav } from "@/components/layout/Header/MobileNav";

/**
 * MobileNav のテスト（qr_code_create-pa6）
 *
 * ハンバーガーで開閉するモバイルメニュー。通常のナビ項目は next/link の Link、
 * 末尾の「QRコード生成」は TrackedLink（location="mobile_nav"）で描画し、どちらもクリックでメニューを閉じる。
 * next/link は Header.test.tsx と同じく <a> に置き換える（onClick を透過させ、TrackedLink の計測が <a> に届くようにする）。
 */

jest.mock("next/link", () => {
  const MockLink = ({
    href,
    children,
    className,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  }) => (
    <a href={href} className={className} onClick={onClick}>
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

const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/guide", label: "使い方" },
];

describe("MobileNav", () => {
  beforeEach(() => {
    trackCtaClicked.mockClear();
  });

  describe("開閉", () => {
    it("初期状態ではメニューが閉じていて、リンクが描画されないこと", () => {
      // 意図: isOpen=false のときは nav 自体を描画しない（aria-expanded=false と整合していること）
      render(<MobileNav items={NAV_ITEMS} />);
      expect(screen.getByRole("button", { name: "メニューを開く" })).toHaveAttribute(
        "aria-expanded",
        "false"
      );
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("ハンバーガーを押すとナビ項目と「QRコード生成」（/create）が表示されること", () => {
      // 意図: items の各リンクと、末尾の CTA が同じメニュー内に並び、href が正しいこと
      render(<MobileNav items={NAV_ITEMS} />);
      fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
      expect(screen.getByRole("button", { name: "メニューを閉じる" })).toHaveAttribute(
        "aria-expanded",
        "true"
      );
      expect(screen.getByRole("link", { name: "ホーム" })).toHaveAttribute("href", "/");
      expect(screen.getByRole("link", { name: "使い方" })).toHaveAttribute("href", "/guide");
      expect(screen.getByRole("link", { name: "QRコード生成" })).toHaveAttribute("href", "/create");
    });

    it("ハンバーガーをもう一度押すとメニューが閉じること", () => {
      // 意図: トグル動作。開いたまま閉じられなくならないこと
      render(<MobileNav items={NAV_ITEMS} />);
      fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
      fireEvent.click(screen.getByRole("button", { name: "メニューを閉じる" }));
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "メニューを開く" })).toHaveAttribute(
        "aria-expanded",
        "false"
      );
    });
  });

  describe("CTA クリック計測", () => {
    it("「QRコード生成」をクリックすると trackCtaClicked(\"QRコード生成\", \"mobile_nav\") が 1 回呼ばれ、メニューが閉じること", () => {
      // 意図: 計測と「閉じる」の両方が動くこと。TrackedLink は追跡 → onClick の順なので、閉じてアンマウントされても計測は漏れない
      render(<MobileNav items={NAV_ITEMS} />);
      fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
      fireEvent.click(screen.getByRole("link", { name: "QRコード生成" }));
      expect(trackCtaClicked).toHaveBeenCalledTimes(1);
      expect(trackCtaClicked).toHaveBeenCalledWith("QRコード生成", "mobile_nav");
      expect(screen.queryByRole("link", { name: "QRコード生成" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "メニューを開く" })).toHaveAttribute(
        "aria-expanded",
        "false"
      );
    });

    it("通常のナビ項目をクリックするとメニューは閉じるが trackCtaClicked は呼ばれないこと", () => {
      // 意図: CTA 以外のリンク（素の Link）のクリックが cta_clicked に混ざらないこと
      render(<MobileNav items={NAV_ITEMS} />);
      fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
      fireEvent.click(screen.getByRole("link", { name: "使い方" }));
      expect(trackCtaClicked).not.toHaveBeenCalled();
      expect(screen.queryByRole("link", { name: "使い方" })).not.toBeInTheDocument();
    });

    it("メニューを開いただけでは trackCtaClicked が呼ばれないこと", () => {
      // 意図: CTA の表示（メニューを開く操作）で計測が飛ばないこと
      render(<MobileNav items={NAV_ITEMS} />);
      fireEvent.click(screen.getByRole("button", { name: "メニューを開く" }));
      expect(trackCtaClicked).not.toHaveBeenCalled();
    });
  });
});
