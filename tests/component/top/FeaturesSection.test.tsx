import React from "react";
import { render, screen } from "@testing-library/react";
import { FeaturesSection } from "@/components/top/FeaturesSection";

describe("FeaturesSection", () => {
  describe("機能カード表示", () => {
    it("4つの機能カードが表示されること", () => {
      render(<FeaturesSection />);
      const cards = screen.getAllByRole("listitem");
      expect(cards).toHaveLength(4);
    });

    it("「UTMパラメータガイダンス」タイトルが表示されること", () => {
      render(<FeaturesSection />);
      expect(screen.getByText("UTMパラメータガイダンス")).toBeInTheDocument();
    });

    it("「装飾フレーム」タイトルが表示されること", () => {
      render(<FeaturesSection />);
      expect(screen.getByText("装飾フレーム")).toBeInTheDocument();
    });

    it("「完全無料・登録不要」タイトルが表示されること", () => {
      render(<FeaturesSection />);
      expect(screen.getByText("完全無料・登録不要")).toBeInTheDocument();
    });

    it("「PNG/SVG/PDF対応」タイトルが表示されること", () => {
      render(<FeaturesSection />);
      expect(screen.getByText("PNG/SVG/PDF対応")).toBeInTheDocument();
    });
  });
});
