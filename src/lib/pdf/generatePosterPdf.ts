import type { PosterState } from "@/types/poster";

/**
 * ポスター用A4縦PDF（最小実装）を生成してダウンロードする。
 * jsPDF を動的インポートしてバンドルサイズを削減する。
 * 完成版PDF生成は後続タスクで実装する。
 *
 * @param state - ポスター状態（現時点では url を使用）
 * @param fileName - ダウンロードファイル名（拡張子なし）
 */
export async function generatePosterPdf(
  state: PosterState,
  fileName: string = "poster"
): Promise<void> {
  const jsPDFModule = await import("jspdf");
  const jsPDF = jsPDFModule.default;

  // A4縦: 210mm x 297mm
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // --- 最小実装: テキストとURL情報を配置 ---
  pdf.setFontSize(18);
  pdf.text("QRコードポスター", 105, 30, { align: "center" });

  pdf.setFontSize(10);
  pdf.text("(印刷用レイアウトは実装予定)", 105, 42, { align: "center" });

  if (state.url) {
    pdf.setFontSize(12);
    pdf.text("URL:", 20, 60);
    pdf.setFontSize(10);
    // URLが長い場合は折り返す
    const urlLines = pdf.splitTextToSize(state.url, 170);
    pdf.text(urlLines, 20, 70);
  }

  // ページ下部に注記
  pdf.setFontSize(8);
  pdf.setTextColor(150);
  pdf.text("QR Code Create - qr-create.jp", 105, 285, { align: "center" });

  pdf.save(`${fileName}.pdf`);
}
