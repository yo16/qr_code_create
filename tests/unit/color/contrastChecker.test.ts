import { getContrastRatio, isContrastSufficient } from "@/lib/color/contrastChecker";

describe("getContrastRatio", () => {
  describe("正常系", () => {
    it("黒(#000000)と白(#ffffff)のコントラスト比が21:1であること", () => {
      const ratio = getContrastRatio("#000000", "#ffffff");
      expect(ratio).toBeCloseTo(21, 1);
    });

    it("白と白(#ffffff と #ffffff)のコントラスト比が1:1であること", () => {
      const ratio = getContrastRatio("#ffffff", "#ffffff");
      expect(ratio).toBeCloseTo(1, 5);
    });

    it("黒と黒(#000000 と #000000)のコントラスト比が1:1であること", () => {
      const ratio = getContrastRatio("#000000", "#000000");
      expect(ratio).toBeCloseTo(1, 5);
    });

    it("前景・背景を入れ替えても同じコントラスト比になること", () => {
      const ratio1 = getContrastRatio("#000000", "#ffffff");
      const ratio2 = getContrastRatio("#ffffff", "#000000");
      expect(ratio1).toBeCloseTo(ratio2, 10);
    });

    it("3桁HEX(#000 と #fff)でも正しく計算されること", () => {
      const ratio = getContrastRatio("#000", "#fff");
      expect(ratio).toBeCloseTo(21, 1);
    });
  });

  describe("境界値", () => {
    // WCAG AA基準(4.5:1)の直上・直下となる色ペアの検証
    // #777777 と #ffffff: コントラスト比 ≒ 4.48（AA未満）
    it("#777777 と #ffffff のコントラスト比が4.5未満であること", () => {
      const ratio = getContrastRatio("#777777", "#ffffff");
      expect(ratio).toBeLessThan(4.5);
    });

    // #767676 と #ffffff: コントラスト比 ≒ 4.54（AA以上）
    it("#767676 と #ffffff のコントラスト比が4.5以上であること", () => {
      const ratio = getContrastRatio("#767676", "#ffffff");
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});

describe("isContrastSufficient", () => {
  describe("正常系", () => {
    it("#000000 と #ffffff の組み合わせで true を返すこと", () => {
      expect(isContrastSufficient("#000000", "#ffffff")).toBe(true);
    });

    it("#ffffff と #000000 の組み合わせ（逆順）でも true を返すこと", () => {
      expect(isContrastSufficient("#ffffff", "#000000")).toBe(true);
    });
  });

  describe("異常系", () => {
    it("薄い色同士(#eeeeee と #ffffff)で false を返すこと", () => {
      expect(isContrastSufficient("#eeeeee", "#ffffff")).toBe(false);
    });

    it("同一色(#000000 と #000000)で false を返すこと", () => {
      expect(isContrastSufficient("#000000", "#000000")).toBe(false);
    });

    it("同一色(#ffffff と #ffffff)で false を返すこと", () => {
      expect(isContrastSufficient("#ffffff", "#ffffff")).toBe(false);
    });
  });

  describe("境界値", () => {
    // #777777(コントラスト比 ≒ 4.48): AA未満 → false
    it("コントラスト比が4.5未満の色ペア(#777777, #ffffff)で false を返すこと", () => {
      expect(isContrastSufficient("#777777", "#ffffff")).toBe(false);
    });

    // #767676(コントラスト比 ≒ 4.54): AA以上 → true
    it("コントラスト比が4.5以上の色ペア(#767676, #ffffff)で true を返すこと", () => {
      expect(isContrastSufficient("#767676", "#ffffff")).toBe(true);
    });
  });
});
