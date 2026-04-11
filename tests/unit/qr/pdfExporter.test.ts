// jsPDF モック
const mockSave = jest.fn();
const mockAddImage = jest.fn();
jest.mock("jspdf", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    addImage: mockAddImage,
    save: mockSave,
  })),
}));

import jsPDF from "jspdf";
import { exportToPdf } from "@/lib/qr/pdfExporter";

const mockJsPDF = jsPDF as jest.MockedClass<typeof jsPDF>;

// Canvas モック
const mockCanvas = {
  toDataURL: jest.fn().mockReturnValue("data:image/png;base64,abc"),
  width: 256,
  height: 256,
} as unknown as HTMLCanvasElement;

beforeEach(() => {
  jest.clearAllMocks();
  (mockCanvas.toDataURL as jest.Mock).mockReturnValue("data:image/png;base64,abc");
});

describe("exportToPdf", () => {
  it("jsPDFコンストラクタがA4/portraitで呼ばれること", async () => {
    await exportToPdf(mockCanvas);
    expect(mockJsPDF).toHaveBeenCalledWith({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
  });

  it("addImageがcanvasのdata URLで呼ばれること", async () => {
    await exportToPdf(mockCanvas);
    expect(mockAddImage).toHaveBeenCalledWith(
      "data:image/png;base64,abc",
      "PNG",
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("saveがデフォルトファイル名\"qrcode.pdf\"で呼ばれること", async () => {
    await exportToPdf(mockCanvas);
    expect(mockSave).toHaveBeenCalledWith("qrcode.pdf");
  });

  it("カスタムファイル名を渡せること", async () => {
    await exportToPdf(mockCanvas, "my-custom.pdf");
    expect(mockSave).toHaveBeenCalledWith("my-custom.pdf");
  });
});
