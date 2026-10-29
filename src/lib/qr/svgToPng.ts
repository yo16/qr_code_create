/** SVG を PNG に変換するときの長辺（px） */
export const SVG_PNG_MAX_EDGE = 512;

/**
 * 寸法が取れない SVG のときに使う辺（px）
 */
const FALLBACK_EDGE = SVG_PNG_MAX_EDGE;

/**
 * SVG の dataURL を <img> に描き、canvas 経由で PNG の dataURL に変換する。
 * 元の比率を保ち、長辺を SVG_PNG_MAX_EDGE にそろえる。
 * 読み込み・描画・変換のいずれかに失敗したら reject する。
 */
export function svgDataUrlToPngDataUrl(svgDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (!w || !h) {
          w = FALLBACK_EDGE;
          h = FALLBACK_EDGE;
        }
        const scale = SVG_PNG_MAX_EDGE / Math.max(w, h);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const png = canvas.toDataURL("image/png");
        if (!png.startsWith("data:image/png;base64,")) {
          reject(new Error("png conversion failed"));
          return;
        }
        resolve(png);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("svg load failed"));
    img.src = svgDataUrl;
  });
}
