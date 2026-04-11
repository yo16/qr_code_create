import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PdfDownloadButton } from "@/components/qr/DownloadPanel/PdfDownloadButton";

// analytics モック
jest.mock("@/lib/analytics/events", () => ({
  trackQrDownloaded: jest.fn(),
}));

// pdfExporter モック
jest.mock("@/lib/qr/pdfExporter", () => ({
  exportToPdf: jest.fn().mockResolvedValue(undefined),
}));

import { exportToPdf } from "@/lib/qr/pdfExporter";
const mockExportToPdf = exportToPdf as jest.MockedFunction<typeof exportToPdf>;

// CanvasRef ヘルパー
function makeCanvasRef(canvas?: HTMLCanvasElement | null) {
  return { current: canvas ?? null } as React.RefObject<HTMLCanvasElement | null>;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockExportToPdf.mockResolvedValue(undefined);
});

describe("PdfDownloadButton", () => {
  it("「PDF形式でダウンロード」ボタンが表示されること", () => {
    render(
      <PdfDownloadButton
        canvasRef={makeCanvasRef()}
        disabled={false}
        hasUtm={false}
        decorationCount={0}
      />
    );
    expect(screen.getByText("PDF形式でダウンロード")).toBeInTheDocument();
  });

  it("disabled=trueでボタンが無効であること", () => {
    render(
      <PdfDownloadButton
        canvasRef={makeCanvasRef()}
        disabled={true}
        hasUtm={false}
        decorationCount={0}
      />
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("disabled=falseでボタンが有効であること", () => {
    render(
      <PdfDownloadButton
        canvasRef={makeCanvasRef()}
        disabled={false}
        hasUtm={false}
        decorationCount={0}
      />
    );
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
  });

  it("ボタンクリックでexportToPdfがcanvasRef.currentを渡して呼ばれること", async () => {
    const mockCanvas = {
      toDataURL: jest.fn().mockReturnValue("data:image/png;base64,abc"),
      width: 256,
      height: 256,
    } as unknown as HTMLCanvasElement;

    render(
      <PdfDownloadButton
        canvasRef={makeCanvasRef(mockCanvas)}
        disabled={false}
        hasUtm={false}
        decorationCount={0}
      />
    );

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockExportToPdf).toHaveBeenCalledWith(mockCanvas, "qrcode.pdf");
    });
  });

  it("canvasRef.currentがnullの場合、exportToPdfが呼ばれないこと", () => {
    render(
      <PdfDownloadButton
        canvasRef={makeCanvasRef(null)}
        disabled={false}
        hasUtm={false}
        decorationCount={0}
      />
    );

    fireEvent.click(screen.getByRole("button"));
    expect(mockExportToPdf).not.toHaveBeenCalled();
  });
});
