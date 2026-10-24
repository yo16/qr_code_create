import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CtaSection } from "@/components/top/CtaSection";

// CTA クリック計測（qr_code_create-pa6）: TrackedLink が呼ぶ trackCtaClicked をモックする
jest.mock("@/lib/analytics/events", () => ({
  trackCtaClicked: jest.fn(),
}));

const { trackCtaClicked } = jest.requireMock("@/lib/analytics/events") as {
  trackCtaClicked: jest.Mock;
};

describe("CtaSection", () => {
  describe("見出し表示", () => {
    it("セクション見出しが表示されること", () => {
      render(<CtaSection />);
      expect(screen.getByRole("heading", { name: /URLを入れて、4つの手順でダウンロードまで/ })).toBeInTheDocument();
    });
  });

  describe("CTAリンク", () => {
    it("CTAリンクが/createを指していること", () => {
      render(<CtaSection />);
      const createLink = screen.getByRole("link", { name: /無料でQRコードを作成する/ });
      expect(createLink).toBeInTheDocument();
      expect(createLink).toHaveAttribute("href", "/create");
    });
  });

  // CTA クリック計測（qr_code_create-pa6）: トップ末尾の CTA は location="top_bottom"
  describe("CTA クリック計測", () => {
    beforeEach(() => {
      trackCtaClicked.mockClear();
    });

    it("CTA をクリックすると trackCtaClicked(\"無料でQRコードを作成する\", \"top_bottom\") が 1 回呼ばれること", () => {
      // 意図: ヒーローの CTA（hero）とは別の location で記録され、ページ下部まで読んだ人のクリックを分けて数えられること
      render(<CtaSection />);
      fireEvent.click(screen.getByRole("link", { name: /無料でQRコードを作成する/ }));
      expect(trackCtaClicked).toHaveBeenCalledTimes(1);
      expect(trackCtaClicked).toHaveBeenCalledWith("無料でQRコードを作成する", "top_bottom");
    });

    it("描画しただけでは trackCtaClicked が呼ばれないこと", () => {
      // 意図: 表示時に計測が飛び、クリック率が過大評価されないこと
      render(<CtaSection />);
      expect(trackCtaClicked).not.toHaveBeenCalled();
    });
  });
});
