import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PosterEditor } from "@/components/poster/PosterEditor/PosterEditor";
import { savePosterHandoff } from "@/lib/handoff/posterHandoff";

// PosterEditor → PosterPreview → QrPreview（実物）→ PdfDownloadButton のつなぎ込みを確かめる。
// handoff（sessionStorage）と validateUrl も実物。qrcode / drawLogo / PDF 生成 / GA だけ差し替える。
jest.mock("qrcode", () => ({
  toCanvas: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/qr/drawLogo", () => ({
  drawLogoOnCanvas: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/pdf/generatePosterPdf", () => ({
  generatePosterPdf: jest.fn().mockResolvedValue(new Blob(["pdf"])),
}));
const mockTrackPosterGenerated = jest.fn();
jest.mock("@/lib/analytics/events", () => ({
  trackQrGenerated: jest.fn(),
  trackErrorOccurred: jest.fn(),
  trackPosterGenerated: (...args: unknown[]) => mockTrackPosterGenerated(...args),
}));

const URL_LABEL = "QRコードに埋め込むURL";
const DESC_LABEL = "説明文（Markdown）";
const READY = { name: "PDFをダウンロード（A4印刷用）" };
const PREPARING = { name: "QRコードを準備中..." };

const baseDecoration = {
  fgColor: "#000000",
  bgColor: "#ffffff",
  logo: null,
  frameType: null,
  caption: { text: "", fontSize: 16 },
  preset: null,
};
const utmValues = { source: "poster", medium: "qr", campaign: "spring", term: "", content: "" };

async function settle() {
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  });
}

async function renderReady(opts: {
  utmEnabled?: boolean;
  logo?: boolean;
  description?: string;
} = {}) {
  savePosterHandoff({
    url: "https://example.com/shop",
    isUrlValid: true,
    utm: utmValues,
    utmEnabled: opts.utmEnabled ?? true,
    decoration: {
      ...baseDecoration,
      logo: opts.logo
        ? { dataUrl: "data:image/png;base64,AA", fileName: "l.png", fileType: "image/png", fileSizeKb: 1, sizePercent: 15 }
        : null,
    },
  });
  render(<PosterEditor />);
  fireEvent.change(screen.getByLabelText(DESC_LABEL), {
    target: { value: opts.description ?? "説明文" },
  });
  await settle();
}

async function clickDownload() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", READY));
  });
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  });
}

beforeEach(() => {
  sessionStorage.clear();
  mockTrackPosterGenerated.mockClear();
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: jest.fn(() => "blob:x") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: jest.fn() });
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("PosterEditor の ready とボタン", () => {
  it("ready になったあと URL を変えると、ボタンが「QRコードを準備中...」で無効に戻り、描画後に有効に戻ること", async () => {
    await renderReady();
    expect(screen.getByRole("button", READY)).not.toBeDisabled();

    fireEvent.change(screen.getByLabelText(URL_LABEL), { target: { value: "https://example.com/other" } });

    expect(screen.getByRole("button", PREPARING)).toBeDisabled();

    await settle();
    expect(screen.getByRole("button", READY)).not.toBeDisabled();
  });

  it("ready になったあと説明文を変えても、QR の描き直しは起きないのでボタンは有効のままであること", async () => {
    await renderReady();

    fireEvent.change(screen.getByLabelText(DESC_LABEL), { target: { value: "別の説明" } });

    expect(screen.getByRole("button", READY)).not.toBeDisabled();
    expect(screen.queryByRole("button", PREPARING)).toBeNull();
  });
});

describe("PosterEditor → trackPosterGenerated", () => {
  it("UTM が ON で値が入っていれば hasUtm=true、ロゴなしなら hasLogo=false、descriptionLength は説明文の長さ", async () => {
    await renderReady({ utmEnabled: true, logo: false, description: "12345678" });
    await clickDownload();

    expect(mockTrackPosterGenerated).toHaveBeenCalledTimes(1);
    expect(mockTrackPosterGenerated).toHaveBeenCalledWith({
      hasUtm: true,
      hasLogo: false,
      descriptionLength: 8,
    });
  });

  it("UTM が OFF なら、UTM の値が入っていても hasUtm=false であること", async () => {
    await renderReady({ utmEnabled: false });
    await clickDownload();

    expect(mockTrackPosterGenerated).toHaveBeenCalledWith(
      expect.objectContaining({ hasUtm: false })
    );
  });

  it("ロゴがあれば hasLogo=true であること", async () => {
    await renderReady({ logo: true });
    await clickDownload();

    expect(mockTrackPosterGenerated).toHaveBeenCalledWith(
      expect.objectContaining({ hasLogo: true })
    );
  });

  it("descriptionLength は trim 前の文字数（改行を含む）であること", async () => {
    await renderReady({ description: "行1\n行2" });
    await clickDownload();

    expect(mockTrackPosterGenerated).toHaveBeenCalledWith(
      expect.objectContaining({ descriptionLength: 5 })
    );
  });
});
