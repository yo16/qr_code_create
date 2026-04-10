/**
 * WCAG 2.1 に基づくコントラスト比計算ユーティリティ
 */

/**
 * HEX カラーコードから相対輝度 (relative luminance) を計算する
 * @param hex "#RRGGBB" または "#RGB" 形式のカラーコード
 * @returns 相対輝度 (0〜1)
 */
function getLuminance(hex: string): number {
  // "#" を除いた文字列に正規化
  const clean = hex.replace(/^#/, "");

  // 3桁を6桁に展開
  const expanded =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  const r = parseInt(expanded.slice(0, 2), 16) / 255;
  const g = parseInt(expanded.slice(2, 4), 16) / 255;
  const b = parseInt(expanded.slice(4, 6), 16) / 255;

  // sRGB → 線形 RGB
  const toLinear = (c: number): number =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const rLin = toLinear(r);
  const gLin = toLinear(g);
  const bLin = toLinear(b);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * 前景色と背景色のコントラスト比を計算する (WCAG 2.1)
 * @param fg 前景色 HEX コード
 * @param bg 背景色 HEX コード
 * @returns コントラスト比 (1:1〜21:1)
 */
export function getContrastRatio(fg: string, bg: string): number {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * コントラスト比が WCAG AA 基準 (4.5:1) を満たすか判定する
 * @param fg 前景色 HEX コード
 * @param bg 背景色 HEX コード
 * @returns AA 基準を満たす場合 true
 */
export function isContrastSufficient(fg: string, bg: string): boolean {
  return getContrastRatio(fg, bg) >= 4.5;
}
