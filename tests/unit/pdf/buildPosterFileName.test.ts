import { buildPosterFileName } from "@/components/poster/PdfDownloadButton/PdfDownloadButton";

describe("buildPosterFileName", () => {
  it("qr-poster-YYYYMMDD-HHmmss.pdf の形式になること", () => {
    expect(buildPosterFileName(new Date(2026, 9, 25, 14, 30, 45))).toBe(
      "qr-poster-20261025-143045.pdf"
    );
  });

  it("月・日・時・分・秒が 1 桁のときは 0 埋めされること", () => {
    expect(buildPosterFileName(new Date(2026, 0, 2, 3, 4, 5))).toBe("qr-poster-20260102-030405.pdf");
  });

  it("年の最後の瞬間（12/31 23:59:59）が正しく出ること", () => {
    expect(buildPosterFileName(new Date(2026, 11, 31, 23, 59, 59))).toBe(
      "qr-poster-20261231-235959.pdf"
    );
  });

  it("年の最初の瞬間（1/1 00:00:00）が 0 埋めされること", () => {
    expect(buildPosterFileName(new Date(2027, 0, 1, 0, 0, 0))).toBe("qr-poster-20270101-000000.pdf");
  });

  it("うるう日（2/29）が正しく出ること", () => {
    expect(buildPosterFileName(new Date(2028, 1, 29, 12, 0, 0))).toBe(
      "qr-poster-20280229-120000.pdf"
    );
  });

  it("引数を省略すると現在時刻から作られ、形式に合うこと", () => {
    expect(buildPosterFileName()).toMatch(/^qr-poster-\d{8}-\d{6}\.pdf$/);
  });
});
