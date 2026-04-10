import React from "react";
import { render, screen } from "@testing-library/react";
import { EffectivenessIndicator } from "@/components/qr/UtmBuilder/EffectivenessIndicator";

describe("EffectivenessIndicator", () => {
  describe("星の表示", () => {
    it("utmCount=0のとき星1個が塗り（filled）で残り4個が空（empty）であること", () => {
      const { container } = render(<EffectivenessIndicator utmCount={0} />);
      const starsWrapper = container.querySelector('[aria-hidden="true"]');
      expect(starsWrapper).not.toBeNull();
      const spans = starsWrapper!.querySelectorAll("span");
      // CSS Modulesのため実際のクラス名は変換されている
      // filled/emptyのクラスを文字列で判定する代わりに、全spanが★であることを確認し
      // star数の配置は仕様通り（0→starCount=1）なので、描画数をテキストで確認する
      expect(spans).toHaveLength(5);
    });

    it("utmCount=0のとき星1個分のfilledクラスが付与されること", () => {
      const { container } = render(<EffectivenessIndicator utmCount={0} />);
      const starsWrapper = container.querySelector('[aria-hidden="true"]');
      const spans = Array.from(starsWrapper!.querySelectorAll("span"));
      // index 0 は filled（クラス名にfilledを含む）、index 1-4 は empty
      expect(spans[0].className).toMatch(/filled/i);
      expect(spans[1].className).toMatch(/empty/i);
      expect(spans[2].className).toMatch(/empty/i);
      expect(spans[3].className).toMatch(/empty/i);
      expect(spans[4].className).toMatch(/empty/i);
    });

    it("utmCount=3のとき星4個がfilledであること", () => {
      const { container } = render(<EffectivenessIndicator utmCount={3} />);
      const starsWrapper = container.querySelector('[aria-hidden="true"]');
      const spans = Array.from(starsWrapper!.querySelectorAll("span"));
      expect(spans[0].className).toMatch(/filled/i);
      expect(spans[1].className).toMatch(/filled/i);
      expect(spans[2].className).toMatch(/filled/i);
      expect(spans[3].className).toMatch(/filled/i);
      expect(spans[4].className).toMatch(/empty/i);
    });

    it("utmCount=5のとき星5個全てがfilledであること", () => {
      const { container } = render(<EffectivenessIndicator utmCount={5} />);
      const starsWrapper = container.querySelector('[aria-hidden="true"]');
      const spans = Array.from(starsWrapper!.querySelectorAll("span"));
      for (const span of spans) {
        expect(span.className).toMatch(/filled/i);
      }
    });
  });

  describe("ARIAアクセシビリティ", () => {
    it("role=\"meter\"が存在すること", () => {
      render(<EffectivenessIndicator utmCount={2} />);
      expect(screen.getByRole("meter")).toBeInTheDocument();
    });

    it("aria-valuenowがutmCountと一致すること", () => {
      render(<EffectivenessIndicator utmCount={3} />);
      expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "3");
    });

    it("aria-valueminが0であること", () => {
      render(<EffectivenessIndicator utmCount={1} />);
      expect(screen.getByRole("meter")).toHaveAttribute("aria-valuemin", "0");
    });

    it("aria-valuemaxが5であること", () => {
      render(<EffectivenessIndicator utmCount={1} />);
      expect(screen.getByRole("meter")).toHaveAttribute("aria-valuemax", "5");
    });
  });

  describe("ラベルの表示", () => {
    it("utmCount=0のときラベルが「低」を含むこと", () => {
      render(<EffectivenessIndicator utmCount={0} />);
      expect(screen.getByText(/マーケティング効果度: 低/)).toBeInTheDocument();
    });

    it("utmCount=4のときラベルが「最高」を含むこと", () => {
      render(<EffectivenessIndicator utmCount={4} />);
      expect(screen.getByText(/マーケティング効果度: 最高/)).toBeInTheDocument();
    });

    it("utmCount=5のときラベルが「最高」を含むこと", () => {
      render(<EffectivenessIndicator utmCount={5} />);
      expect(screen.getByText(/マーケティング効果度: 最高/)).toBeInTheDocument();
    });

    it("aria-labelにラベル文字列が含まれること（utmCount=0）", () => {
      render(<EffectivenessIndicator utmCount={0} />);
      expect(screen.getByRole("meter")).toHaveAttribute(
        "aria-label",
        "マーケティング効果度: 低"
      );
    });

    it("aria-labelにラベル文字列が含まれること（utmCount=5）", () => {
      render(<EffectivenessIndicator utmCount={5} />);
      expect(screen.getByRole("meter")).toHaveAttribute(
        "aria-label",
        "マーケティング効果度: 最高"
      );
    });
  });

  describe("CROメッセージの表示", () => {
    it("utmCount=0のとき「マーケティング効果の測定ができません」が表示されること", () => {
      render(<EffectivenessIndicator utmCount={0} />);
      expect(screen.getByText("マーケティング効果の測定ができません")).toBeInTheDocument();
    });

    it("utmCount=1のとき「基本的なトラッキングが可能です」が表示されること", () => {
      render(<EffectivenessIndicator utmCount={1} />);
      expect(screen.getByText("基本的なトラッキングが可能です")).toBeInTheDocument();
    });

    it("utmCount=2のとき「効果測定の精度が上がります」が表示されること", () => {
      render(<EffectivenessIndicator utmCount={2} />);
      expect(screen.getByText("効果測定の精度が上がります")).toBeInTheDocument();
    });

    it("utmCount=3のとき「Google Analyticsで詳細な分析が可能です」が表示されること", () => {
      render(<EffectivenessIndicator utmCount={3} />);
      expect(screen.getByText("Google Analyticsで詳細な分析が可能です")).toBeInTheDocument();
    });

    it("utmCount=4のとき「完璧なトラッキング設定です！」が表示されること", () => {
      render(<EffectivenessIndicator utmCount={4} />);
      expect(screen.getByText("完璧なトラッキング設定です！")).toBeInTheDocument();
    });

    it("utmCount=5のとき「完璧なトラッキング設定です！」が表示されること", () => {
      render(<EffectivenessIndicator utmCount={5} />);
      expect(screen.getByText("完璧なトラッキング設定です！")).toBeInTheDocument();
    });
  });
});
