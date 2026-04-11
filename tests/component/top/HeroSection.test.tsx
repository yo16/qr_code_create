import React from "react";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "@/components/top/HeroSection";

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
});
