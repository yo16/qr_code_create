import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { DownloadPanel } from "@/components/qr/DownloadPanel/DownloadPanel";
import { PosterEditor } from "@/components/poster/PosterEditor/PosterEditor";
import { savePosterHandoff, loadPosterHandoff } from "@/lib/handoff/posterHandoff";

// 実物の posterHandoff（sessionStorage）を通して、/create から /poster へ frameColor が渡ることを確かめる。
// PosterEditor 側は、QR に渡る frameConfig を drawFrame の呼び出しで観測する。
jest.mock("@/lib/analytics/events", () => ({
  trackQrDownloaded: jest.fn(),
  trackQrGenerated: jest.fn(),
  trackErrorOccurred: jest.fn(),
  trackPosterGenerated: jest.fn(),
}));
jest.mock("@/lib/qr/canvasExporter", () => ({
  canvasToPng: jest.fn(),
  canvasToSvg: jest.fn(),
  downloadFile: jest.fn(),
}));
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@/lib/constants/features", () => ({
  FEATURE_FLAGS: { posterPage: true },
}));
jest.mock("qrcode", () => ({
  toCanvas: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/qr/drawLogo", () => ({
  drawLogoOnCanvas: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/pdf/generatePosterPdf", () => ({
  generatePosterPdf: jest.fn(),
}));
const mockDrawFrame = jest.fn();
jest.mock("@/lib/qr/frameRenderer", () => ({
  ...jest.requireActual("@/lib/qr/frameRenderer"),
  drawFrame: (...args: unknown[]) => mockDrawFrame(...args),
}));

const decoration = {
  fgColor: "#000000",
  bgColor: "#ffffff",
  logo: null,
  frameType: "simple" as const,
  caption: { text: "", fontSize: 14 },
  preset: null,
};
const utm = { source: "", medium: "qr", campaign: "", term: "", content: "" };

function canvasRef() {
  return { current: null } as React.RefObject<HTMLCanvasElement | null>;
}

beforeEach(() => {
  sessionStorage.clear();
  mockPush.mockClear();
  mockDrawFrame.mockClear();
  jest
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue({ clearRect: jest.fn() } as unknown as CanvasRenderingContext2D);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("DownloadPanel の frameColor 引き継ぎ", () => {
  it("frameColor を渡すと、ポスターへの引き継ぎ payload に入ること", () => {
    render(
      <DownloadPanel
        canvasRef={canvasRef()}
        hasUtm={false}
        decorationCount={1}
        url="https://example.com"
        isUrlValid
        utm={utm}
        utmEnabled
        decoration={decoration}
        frameColor="#c53030"
      />
    );

    fireEvent.click(screen.getByText("印刷用ポスターを作る →"));

    const payload = loadPosterHandoff();
    expect(payload?.frameColor).toBe("#c53030");
    expect(payload?.decoration.frameType).toBe("simple");
    expect(mockPush).toHaveBeenCalledWith("/poster");
  });

  it("frameColor を渡さなければ payload に frameColor が入らないこと", () => {
    render(
      <DownloadPanel
        canvasRef={canvasRef()}
        hasUtm={false}
        decorationCount={0}
        url="https://example.com"
        isUrlValid
        utm={utm}
        utmEnabled
        decoration={decoration}
      />
    );

    fireEvent.click(screen.getByText("印刷用ポスターを作る →"));

    expect(loadPosterHandoff()?.frameColor).toBeUndefined();
  });
});

describe("PosterEditor での frameColor", () => {
  async function renderEditorWithPayload(frameColor: string | undefined) {
    jest.useFakeTimers();
    savePosterHandoff({
      url: "https://example.com",
      isUrlValid: true,
      utm,
      utmEnabled: false,
      decoration,
      ...(frameColor === undefined ? {} : { frameColor }),
    });
    // sessionStorage の JSON から読み戻すので、古い payload（キーなし）と同じ形になる
    render(<PosterEditor />);
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    await act(async () => {
      await Promise.resolve();
    });
  }

  it("payload の frameColor がプレビューのフレームの色になること", async () => {
    await renderEditorWithPayload("#c53030");

    expect(mockDrawFrame).toHaveBeenCalled();
    for (const call of mockDrawFrame.mock.calls) {
      expect(call[1]).toEqual({ type: "simple", color: "#c53030" });
    }
  });

  it("古い payload（frameColor なし）ではフレームの色が黒になること", async () => {
    await renderEditorWithPayload(undefined);

    expect(mockDrawFrame).toHaveBeenCalled();
    for (const call of mockDrawFrame.mock.calls) {
      expect(call[1]).toEqual({ type: "simple", color: "#000000" });
    }
  });
});
