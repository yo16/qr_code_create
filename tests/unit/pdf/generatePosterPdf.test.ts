// jsPDF モック（動的importに対応するため jest.mock を先に定義）
const mockSave = jest.fn();
const mockText = jest.fn();
const mockSetFontSize = jest.fn();
const mockSetTextColor = jest.fn();
const mockSplitTextToSize = jest.fn().mockReturnValue(["mocked-line"]);

jest.mock("jspdf", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    setFontSize: mockSetFontSize,
    setTextColor: mockSetTextColor,
    text: mockText,
    splitTextToSize: mockSplitTextToSize,
    save: mockSave,
  })),
}));

import jsPDF from "jspdf";
import { generatePosterPdf } from "@/lib/pdf/generatePosterPdf";
import type { PosterState } from "@/types/poster";

const mockJsPDF = jsPDF as jest.MockedClass<typeof jsPDF>;

// テスト用の有効な PosterState
const validState: PosterState = {
  url: "https://example.com",
  isUrlValid: true,
  description: "",
  utm: { source: "", medium: "qr", campaign: "", term: "", content: "" },
  utmEnabled: true,
  decoration: {
    fgColor: "#000000",
    bgColor: "#ffffff",
    logo: null,
    frameType: null,
    caption: { text: "", fontSize: 14 },
    preset: null,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSplitTextToSize.mockReturnValue(["mocked-line"]);
});

describe("generatePosterPdf", () => {
  it("正常な PosterState を渡すと例外なく完了すること", async () => {
    await expect(generatePosterPdf(validState)).resolves.toBeUndefined();
  });

  it("jsPDF が動的 import され、save() がファイル名を引数で呼ばれること", async () => {
    await generatePosterPdf(validState, "my-poster");

    expect(mockJsPDF).toHaveBeenCalledTimes(1);
    expect(mockJsPDF).toHaveBeenCalledWith({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith("my-poster.pdf");
  });

  it("fileName を省略するとデフォルト \"poster.pdf\" で save() が呼ばれること", async () => {
    await generatePosterPdf(validState);

    expect(mockSave).toHaveBeenCalledWith("poster.pdf");
  });

  it("URL が空文字でも例外にならないこと", async () => {
    const stateWithEmptyUrl: PosterState = {
      ...validState,
      url: "",
      isUrlValid: false,
    };

    await expect(generatePosterPdf(stateWithEmptyUrl)).resolves.toBeUndefined();
    // URL空文字でも save() は呼ばれること
    expect(mockSave).toHaveBeenCalledTimes(1);
  });
});
