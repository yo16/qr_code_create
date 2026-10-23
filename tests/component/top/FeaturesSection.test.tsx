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

  describe("絵文字アイコンの不使用（デザインブラッシュアップ qr_code_create-h58）", () => {
    // 意図: 絵文字アイコンは「AI 生成風」の兆候なので、各 listitem のテキスト
    // （aria-hidden のアイコン span も textContent に含まれる）に
    // Extended_Pictographic（絵文字・絵文字候補の記号）が含まれないことを確認する
    it("各 listitem のテキストに絵文字が含まれないこと", () => {
      render(<FeaturesSection />);
      const items = screen.getAllByRole("listitem");
      const offending = items
        .map((item) => item.textContent ?? "")
        .filter((text) => /\p{Extended_Pictographic}/u.test(text));
      expect(offending).toEqual([]);
    });
  });
});
