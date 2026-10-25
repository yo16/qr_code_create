// QR のダウンロード画像の大きさが、canvas の属性サイズ（width / height）とピクセルだけで決まり、
// style（インライン寸法）や表示上の大きさに依存しないことを確かめる（qr_code_create-b0w）。
// QrPreview は描画後にインラインの寸法を消すので、style が空の canvas でも出力が変わらないことが必要。
const mockSave = jest.fn();
const mockAddImage = jest.fn();
jest.mock("jspdf", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ addImage: mockAddImage, save: mockSave })),
}));

import { canvasToPngScaled, canvasToSvg } from "@/lib/qr/canvasExporter";
import { exportToPdf } from "@/lib/qr/pdfExporter";

/** 属性サイズ 512、style は空、表示上の大きさは 0 の canvas（スマホ幅で枠が縮んだ状態を想定） */
function makeCanvas(style: { width: string; height: string }) {
  return {
    width: 512,
    height: 512,
    style,
    clientWidth: 0,
    clientHeight: 0,
    getBoundingClientRect: () => ({ width: 0, height: 0 }),
    toDataURL: jest.fn().mockReturnValue("data:image/png;base64,abc"),
  } as unknown as HTMLCanvasElement;
}

const STYLES = [
  ["style が空", { width: "", height: "" }],
  ["style が別の大きさ（128px）", { width: "128px", height: "128px" }],
] as const;

beforeEach(() => {
  jest.clearAllMocks();
});

describe.each(STYLES)("出力の大きさが属性サイズに基づくこと（%s）", (_name, style) => {
  it("PNG（等倍）は canvas の toDataURL をそのまま使うこと", () => {
    const canvas = makeCanvas(style);
    const { canvasToPng } = jest.requireActual("@/lib/qr/canvasExporter");
    expect(canvasToPng(canvas)).toBe("data:image/png;base64,abc");
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/png");
  });

  it("PNG（2 倍）は属性サイズ 512 の 2 倍（1024 x 1024）の canvas を作ること", () => {
    const canvas = makeCanvas(style);
    const scaled = {
      width: 0,
      height: 0,
      toDataURL: jest.fn().mockReturnValue("data:image/png;base64,scaled"),
      getContext: jest.fn().mockReturnValue({ imageSmoothingEnabled: true, drawImage: jest.fn() }),
    };
    const realCreate = document.createElement.bind(document);
    const spy = jest.spyOn(document, "createElement").mockImplementation(((tag: string) =>
      tag === "canvas" ? (scaled as unknown as HTMLElement) : realCreate(tag)) as typeof document.createElement);

    canvasToPngScaled(canvas, 2);
    spy.mockRestore();

    expect(scaled.width).toBe(1024);
    expect(scaled.height).toBe(1024);
    const drawImage = (scaled.getContext() as { drawImage: jest.Mock }).drawImage;
    expect(drawImage).toHaveBeenCalledWith(canvas, 0, 0, 1024, 1024);
  });

  it("SVG の width / height / viewBox は属性サイズ（512）になること", () => {
    const svg = canvasToSvg(makeCanvas(style));
    expect(svg).toContain('width="512"');
    expect(svg).toContain('height="512"');
  });

  it("PDF は A4 中央の 80mm 角に画像を貼り、canvas の toDataURL を使うこと（style・表示サイズに依存しない）", async () => {
    const canvas = makeCanvas(style);
    await exportToPdf(canvas);

    expect(canvas.toDataURL).toHaveBeenCalledWith("image/png");
    expect(mockAddImage).toHaveBeenCalledWith("data:image/png;base64,abc", "PNG", 65, 108.5, 80, 80);
  });
});
