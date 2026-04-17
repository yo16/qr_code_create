import type { CaptionConfig } from "@/types/qr";

const CAPTION_PADDING = 8;

/**
 * QRコードcanvasにキャプションを合成した新しいcanvasを返す。
 * キャプションが空または未指定の場合は元のcanvasをそのまま返す。
 */
export function createCanvasWithCaption(
  sourceCanvas: HTMLCanvasElement,
  caption?: CaptionConfig
): HTMLCanvasElement {
  if (!caption || caption.text.trim() === "") {
    return sourceCanvas;
  }

  const capH = caption.fontSize + CAPTION_PADDING * 2;
  const width = sourceCanvas.width;
  const height = sourceCanvas.height + capH;

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = width;
  exportCanvas.height = height;

  const ctx = exportCanvas.getContext("2d");
  if (!ctx) {
    return sourceCanvas;
  }

  // 背景を白で塗りつぶし
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // 元のQRコード画像をコピー
  ctx.drawImage(sourceCanvas, 0, 0);

  // キャプションテキストを描画
  ctx.fillStyle = "#000000";
  ctx.font = `${caption.fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(caption.text, width / 2, sourceCanvas.height + capH / 2);

  return exportCanvas;
}
