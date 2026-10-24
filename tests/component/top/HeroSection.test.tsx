import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { HeroSection } from "@/components/top/HeroSection";

// CTA クリック計測（qr_code_create-pa6）: TrackedLink が呼ぶ trackCtaClicked をモックする
jest.mock("@/lib/analytics/events", () => ({
  trackCtaClicked: jest.fn(),
}));

const { trackCtaClicked } = jest.requireMock("@/lib/analytics/events") as {
  trackCtaClicked: jest.Mock;
};

describe("HeroSection", () => {
  describe("テキスト表示", () => {
    it("メインキャッチコピーが表示されること", () => {
      render(<HeroSection />);
      expect(screen.getByText(/UTMパラメータ付きQRコードを/)).toBeInTheDocument();
    });

    it("「完全無料・登録不要」テキストが表示されること", () => {
      render(<HeroSection />);
      expect(screen.getByText(/完全無料・登録不要/)).toBeInTheDocument();
    });
  });

  describe("CTAリンク", () => {
    it("「無料でQRコードを作成」CTAリンクが/createを指していること", () => {
      render(<HeroSection />);
      const createLink = screen.getByRole("link", { name: /無料でQRコードを作成/ });
      expect(createLink).toBeInTheDocument();
      expect(createLink).toHaveAttribute("href", "/create");
    });

    it("「使い方を見る」リンクが/guideを指していること", () => {
      render(<HeroSection />);
      const guideLink = screen.getByRole("link", { name: /使い方を見る/ });
      expect(guideLink).toBeInTheDocument();
      expect(guideLink).toHaveAttribute("href", "/guide");
    });
  });

  // CTA クリック計測（qr_code_create-pa6）: ヒーローの 2 つの CTA は location="hero" で、文言が button_text になる
  describe("CTA クリック計測", () => {
    beforeEach(() => {
      trackCtaClicked.mockClear();
    });

    it("「無料でQRコードを作成」をクリックすると trackCtaClicked(\"無料でQRコードを作成\", \"hero\") が 1 回呼ばれること", () => {
      // 意図: 主 CTA のクリックが hero の cta_clicked として記録されること（既存テストと同じリンクを押す）
      render(<HeroSection />);
      fireEvent.click(screen.getByRole("link", { name: /無料でQRコードを作成/ }));
      expect(trackCtaClicked).toHaveBeenCalledTimes(1);
      expect(trackCtaClicked).toHaveBeenCalledWith("無料でQRコードを作成", "hero");
    });

    it("「使い方を見る」をクリックすると trackCtaClicked(\"使い方を見る\", \"hero\") が呼ばれること", () => {
      // 意図: 副 CTA も同じ location=hero で送られ、button_text の文言で主 CTA と区別できること
      render(<HeroSection />);
      fireEvent.click(screen.getByRole("link", { name: /使い方を見る/ }));
      expect(trackCtaClicked).toHaveBeenCalledTimes(1);
      expect(trackCtaClicked).toHaveBeenCalledWith("使い方を見る", "hero");
    });

    it("描画しただけでは trackCtaClicked が呼ばれないこと", () => {
      // 意図: 表示時に計測が飛び、クリック率が過大評価されないこと
      render(<HeroSection />);
      expect(trackCtaClicked).not.toHaveBeenCalled();
    });
  });
});
