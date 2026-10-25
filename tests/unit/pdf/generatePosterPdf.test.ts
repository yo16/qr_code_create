// html2canvas / jsPDF は動的 import されるため、jest.mock で差し替える
const mockAddImage = jest.fn();
const mockOutput = jest.fn();
const mockToDataURL = jest.fn();
const fakeCanvas = {
  width: 1985,
  height: 2807,
  toDataURL: (...args: unknown[]) => mockToDataURL(...args),
};
const mockHtml2canvas = jest.fn();

jest.mock("jspdf", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    addImage: (...args: unknown[]) => mockAddImage(...args),
    output: (...args: unknown[]) => mockOutput(...args),
  })),
}));
jest.mock("html2canvas", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockHtml2canvas(...args),
}));

import jsPDF from "jspdf";
import {
  generatePosterPdf,
  CAPTURE_WIDTH_PX,
  CAPTURE_SCALE,
} from "@/lib/pdf/generatePosterPdf";

const mockJsPDF = jsPDF as unknown as jest.Mock;

function makeElement(): HTMLElement {
  return document.createElement("div");
}

beforeEach(() => {
  jest.clearAllMocks();
  fakeCanvas.width = 1985;
  fakeCanvas.height = 2807;
  mockToDataURL.mockReturnValue("data:image/jpeg;base64,AAAA");
  mockHtml2canvas.mockResolvedValue(fakeCanvas);
  mockOutput.mockReturnValue(new Blob(["pdf"], { type: "application/pdf" }));
});

describe("generatePosterPdf", () => {
  it("PDF の Blob を返すこと", async () => {
    const blob = await generatePosterPdf({ previewElement: makeElement() });

    expect(blob).toBeInstanceOf(Blob);
    expect(mockOutput).toHaveBeenCalledWith("blob");
  });

  it("jsPDF が A4 縦・mm 単位で作られること", async () => {
    await generatePosterPdf({ previewElement: makeElement() });

    expect(mockJsPDF).toHaveBeenCalledTimes(1);
    expect(mockJsPDF).toHaveBeenCalledWith({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
  });

  it("addImage が JPEG で (0, 0, 210, 297) の A4 全面に貼られること", async () => {
    await generatePosterPdf({ previewElement: makeElement() });

    expect(mockAddImage).toHaveBeenCalledTimes(1);
    expect(mockAddImage).toHaveBeenCalledWith("data:image/jpeg;base64,AAAA", "JPEG", 0, 0, 210, 297);
    expect(mockToDataURL).toHaveBeenCalledWith("image/jpeg", expect.any(Number));
  });

  it("html2canvas に撮影対象の要素と width 794・scale 2.5 が渡ること", async () => {
    const element = makeElement();
    await generatePosterPdf({ previewElement: element });

    expect(mockHtml2canvas).toHaveBeenCalledTimes(1);
    const [target, options] = mockHtml2canvas.mock.calls[0];
    expect(target).toBe(element);
    expect(options.width).toBe(794);
    expect(options.scale).toBe(2.5);
    expect(CAPTURE_WIDTH_PX).toBe(794);
    expect(CAPTURE_SCALE).toBe(2.5);
    // A4 比率（210:297）に高さが合っていること
    expect(options.height).toBe(Math.round((794 * 297) / 210));
    expect(options.backgroundColor).toBe("#ffffff");
  });

  it("onclone で複製側の枠が幅 794px の左上固定になること", async () => {
    await generatePosterPdf({ previewElement: makeElement() });

    const options = mockHtml2canvas.mock.calls[0][1];
    const cloned = document.createElement("div");
    cloned.style.width = "320px";
    cloned.style.maxWidth = "100%";
    options.onclone(document, cloned);

    expect(cloned.style.width).toBe("794px");
    expect(cloned.style.maxWidth).toBe("none");
    expect(cloned.style.position).toBe("fixed");
    expect(cloned.style.left).toBe("0px");
    expect(cloned.style.top).toBe("0px");
  });

  it("正常終了後に canvas のサイズが 0 に戻されること（メモリ解放）", async () => {
    await generatePosterPdf({ previewElement: makeElement() });

    expect(fakeCanvas.width).toBe(0);
    expect(fakeCanvas.height).toBe(0);
  });

  it("addImage が例外を投げても canvas が後始末され、例外が呼び出し元に伝わること", async () => {
    mockAddImage.mockImplementationOnce(() => {
      throw new Error("addImage failed");
    });

    await expect(generatePosterPdf({ previewElement: makeElement() })).rejects.toThrow(
      "addImage failed"
    );
    expect(fakeCanvas.width).toBe(0);
    expect(fakeCanvas.height).toBe(0);
  });

  it("toDataURL が例外を投げても canvas が後始末されること", async () => {
    mockToDataURL.mockImplementationOnce(() => {
      throw new Error("too large");
    });

    await expect(generatePosterPdf({ previewElement: makeElement() })).rejects.toThrow("too large");
    expect(fakeCanvas.width).toBe(0);
    expect(mockAddImage).not.toHaveBeenCalled();
  });

  it("html2canvas が失敗したら例外を伝え、PDF は作られないこと", async () => {
    mockHtml2canvas.mockRejectedValueOnce(new Error("capture failed"));

    await expect(generatePosterPdf({ previewElement: makeElement() })).rejects.toThrow(
      "capture failed"
    );
    expect(mockJsPDF).not.toHaveBeenCalled();
  });
});
