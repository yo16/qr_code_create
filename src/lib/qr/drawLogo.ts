import type { LogoConfig } from "@/types/qr";

/**
 * ロゴ画像をCanvasの中央に描画する。
 * 描画順: 白背景矩形 → ロゴ画像
 * ロゴの読み込みに失敗した場合は描画をスキップし、エラーをスローしない。
 */
export async function drawLogoOnCanvas(
  canvas: HTMLCanvasElement,
  logo: LogoConfig
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const canvasSize = canvas.width;
  const logoSizePx = canvasSize * (logo.sizePercent / 100);
  const margin = 6;
  const bgSize = logoSizePx + margin * 2;
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;

  let img: HTMLImageElement;
  try {
    img = await loadLogoImage(logo.dataUrl);
  } catch {
    // ロゴ読み込み失敗時はスキップ（エラーで落ちない）
    return;
  }

  // 白背景矩形を中央に描画
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(
    centerX - bgSize / 2,
    centerY - bgSize / 2,
    bgSize,
    bgSize
  );

  // ロゴ画像をアスペクト比維持で中央にフィット
  const { drawWidth, drawHeight } = calcFitSize(
    img.naturalWidth,
    img.naturalHeight,
    logoSizePx
  );

  ctx.drawImage(
    img,
    centerX - drawWidth / 2,
    centerY - drawHeight / 2,
    drawWidth,
    drawHeight
  );
}

/** ロゴ画像を Promise で読み込む（失敗時は reject） */
function loadLogoImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * 最大辺が maxSize に収まるように幅・高さを計算する。
 * 正方形でない画像も中央に収まるようにフィットさせる。
 */
function calcFitSize(
  naturalWidth: number,
  naturalHeight: number,
  maxSize: number
): { drawWidth: number; drawHeight: number } {
  if (naturalWidth === 0 || naturalHeight === 0) {
    return { drawWidth: maxSize, drawHeight: maxSize };
  }

  const scale = Math.min(maxSize / naturalWidth, maxSize / naturalHeight);
  return {
    drawWidth: naturalWidth * scale,
    drawHeight: naturalHeight * scale,
  };
}
