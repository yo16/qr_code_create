/** A4縦（mm） */
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * 撮影する枠の幅（px）。A4 を 96dpi で表した幅。
 * 画面のプレビューの幅に関係なく、同じ見た目・同じ解像度の PDF にするため、複製側でこの幅に固定する。
 * 高さは A4 比率（210:297）から決める。
 */
export const CAPTURE_WIDTH_PX = 794;
export const CAPTURE_HEIGHT_PX = Math.round((CAPTURE_WIDTH_PX * A4_HEIGHT_MM) / A4_WIDTH_MM);

/** 倍率。794px x 2.5 = 約 1985px（A4 幅で約 240dpi）。メモリを抑えるため 3 までは上げない */
export const CAPTURE_SCALE = 2.5;

/** JPEG の品質。PNG のままだと A4 全面で数十 MB になりメモリを圧迫するため JPEG にする */
const JPEG_QUALITY = 0.92;

export interface GeneratePosterPdfOptions {
  /** PosterPreview の A4 の枠（html2canvas で画像化する対象） */
  previewElement: HTMLElement;
}

/**
 * プレビューの DOM を画像にして A4 縦 1 ページの PDF に貼り、Blob で返す。
 * 日本語はフォントを埋め込まず、画面の描画結果をラスタライズして扱う。
 * jsPDF と html2canvas は重いので、呼ばれたときに動的インポートする。
 * 保存（ダウンロード）は呼び出し側で行う。
 */
export async function generatePosterPdf({
  previewElement,
}: GeneratePosterPdfOptions): Promise<Blob> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(previewElement, {
    scale: CAPTURE_SCALE,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    // 画面のスクロール位置や列幅に影響されないよう、複製側の枠を左上に固定幅で置いて撮る
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
    width: CAPTURE_WIDTH_PX,
    height: CAPTURE_HEIGHT_PX,
    onclone: (_doc, clonedElement) => {
      const style = clonedElement.style;
      style.position = "fixed";
      style.left = "0";
      style.top = "0";
      style.width = `${CAPTURE_WIDTH_PX}px`;
      style.maxWidth = "none";
      style.margin = "0";
    },
  });

  try {
    // 枠は常に白地なので JPEG（透過なし）で問題ない
    const imageData = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    pdf.addImage(imageData, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
    return pdf.output("blob");
  } finally {
    // 大きな canvas を早めに手放す（失敗したときも）
    canvas.width = 0;
    canvas.height = 0;
  }
}
