// html2canvas だけを偽物にし、jsPDF は実物のまま generatePosterPdf を動かして、実際の PDF を検証する。
// 偽の canvas の toDataURL は、小さな実物の JPEG（1x1）の data URL を返す。
const TINY_JPEG_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

const fakeCanvas = {
  width: 1985,
  height: 2807,
  toDataURL: jest.fn(() => TINY_JPEG_DATA_URL),
};
jest.mock("html2canvas", () => ({
  __esModule: true,
  default: jest.fn(async () => fakeCanvas),
}));

import { TextEncoder, TextDecoder } from "util";
import { generatePosterPdf } from "@/lib/pdf/generatePosterPdf";

// jsdom には TextEncoder / TextDecoder が無く、jsPDF（node ビルド）の依存が読み込めないので Node のものを使う。
// jsPDF は generatePosterPdf の中で動的 import されるため、ここで先に設定すれば間に合う
Object.assign(globalThis, { TextEncoder, TextDecoder });

/** jsdom の Blob から中身を 1 バイト = 1 文字の文字列として読む（Blob.arrayBuffer / text が無い環境向け） */
function readBlobAsBinaryString(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsBinaryString(blob);
  });
}

describe("generatePosterPdf（実物の jsPDF）", () => {
  it("中身のある PDF の Blob を返し、先頭が %PDF- で、ページが 1 枚であること", async () => {
    const blob = await generatePosterPdf({ previewElement: document.createElement("div") });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe("application/pdf");

    const content = await readBlobAsBinaryString(blob);
    expect(content.startsWith("%PDF-")).toBe(true);
    // ページ辞書 /Type /Page の数（ページツリー /Type /Pages は数えない）
    const pages = content.match(/\/Type\s*\/Page(?![A-Za-z])/g) ?? [];
    expect(pages).toHaveLength(1);
  });

  it("ページの大きさが A4 縦（約 595 x 842 pt）であること", async () => {
    const blob = await generatePosterPdf({ previewElement: document.createElement("div") });
    const content = await readBlobAsBinaryString(blob);

    const match = content.match(/\/MediaBox\s*\[\s*0(?:\.0+)?\s+0(?:\.0+)?\s+([\d.]+)\s+([\d.]+)\s*\]/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeCloseTo(595.28, 0);
    expect(Number(match![2])).toBeCloseTo(841.89, 0);
  });
});
