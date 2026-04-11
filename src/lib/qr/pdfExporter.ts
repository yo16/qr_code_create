// Canvas要素をPDFとしてダウンロード
// jsPDFは動的インポート（バンドルサイズ削減）
export async function exportToPdf(
  canvas: HTMLCanvasElement,
  fileName: string = "qrcode.pdf"
): Promise<void> {
  const jsPDFModule = await import("jspdf");
  const jsPDF = jsPDFModule.default;
  const dataUrl = canvas.toDataURL("image/png");

  // A4サイズ: 210mm x 297mm
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // QRコードをA4ページの中央に配置
  const qrSize = 80; // mm
  const x = (210 - qrSize) / 2;
  const y = (297 - qrSize) / 2;

  pdf.addImage(dataUrl, "PNG", x, y, qrSize, qrSize);
  pdf.save(fileName);
}
