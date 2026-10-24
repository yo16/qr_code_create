import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PdfDownloadButton } from "@/components/qr/DownloadPanel/PdfDownloadButton";

// analytics モック
jest.mock("@/lib/analytics/events", () => ({
  trackQrDownloaded: jest.fn(),
  trackErrorOccurred: jest.fn(),
}));

// pdfExporter モック
jest.mock("@/lib/qr/pdfExporter", () => ({
  exportToPdf: jest.fn().mockResolvedValue(undefined),
}));

import { exportToPdf } from "@/lib/qr/pdfExporter";
import { trackQrDownloaded, trackErrorOccurred } from "@/lib/analytics/events";
const mockExportToPdf = exportToPdf as jest.MockedFunction<typeof exportToPdf>;
const mockTrackQrDownloaded = trackQrDownloaded as jest.MockedFunction<typeof trackQrDownloaded>;
const mockTrackErrorOccurred = trackErrorOccurred as jest.MockedFunction<typeof trackErrorOccurred>;

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

  // エラー計測（qr_code_create-pa6）: exportToPdf の失敗を未処理の reject にせず、
  // 種類（error.name）だけを trackErrorOccurred("pdf_export", ...) に送り、元のエラーは console.error に残す
  describe("エラー計測 (trackErrorOccurred)", () => {
    const makeMockCanvas = () =>
      ({
        toDataURL: jest.fn().mockReturnValue("data:image/png;base64,abc"),
        width: 256,
        height: 256,
      }) as unknown as HTMLCanvasElement;

    const renderButton = () =>
      render(
        <PdfDownloadButton
          canvasRef={makeCanvasRef(makeMockCanvas())}
          disabled={false}
          hasUtm={true}
          decorationCount={2}
        />
      );

    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      // 失敗時の console.error はテスト出力を汚すので抑制しつつ、呼ばれたこと自体は検証できるようにする
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("成功時は trackQrDownloaded が呼ばれ、trackErrorOccurred と console.error は呼ばれないこと", async () => {
      // 意図: 正常系でエラー計測が誤発火せず、error_occurred の件数が実態より増えないこと
      renderButton();
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(mockTrackQrDownloaded).toHaveBeenCalledWith({
          format: "pdf",
          hasUtm: true,
          decorationCount: 2,
        });
      });
      expect(mockTrackErrorOccurred).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("exportToPdf が Error で失敗すると trackErrorOccurred(\"pdf_export\", \"Error\") が 1 回呼ばれ、trackQrDownloaded は呼ばれないこと", async () => {
      // 意図: 失敗を error_occurred として記録し、ダウンロード成功（qr_downloaded）として数えないこと
      mockExportToPdf.mockRejectedValueOnce(new Error("x"));
      renderButton();
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(mockTrackErrorOccurred).toHaveBeenCalledTimes(1);
      });
      expect(mockTrackErrorOccurred).toHaveBeenCalledWith("pdf_export", "Error");
      expect(mockTrackQrDownloaded).not.toHaveBeenCalled();
    });

    it("error_message に相当する第 2 引数が種類（error.name）だけで、message や URL を含まないこと", async () => {
      // 意図: プライバシーポリシー「エラーの発生とその種類（入力した内容は含みません）」との整合。
      //       message に URL やトークンが混ざっていても、送るのは name（ここでは RangeError）だけであること
      mockExportToPdf.mockRejectedValueOnce(
        new RangeError("failed for https://example.com/secret?token=abc")
      );
      renderButton();
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(mockTrackErrorOccurred).toHaveBeenCalledTimes(1);
      });
      const [errorType, errorMessage] = mockTrackErrorOccurred.mock.calls[0];
      expect(errorType).toBe("pdf_export");
      expect(errorMessage).toBe("RangeError");
      expect(errorMessage).not.toContain("https://");
      expect(errorMessage).not.toContain("example.com");
      expect(errorMessage).not.toContain("token");
    });

    it("Error 以外の値（文字列）で reject された場合は種類が \"unknown\" になること", async () => {
      // 意図: instanceof Error でない値が投げられても、その値（入力内容を含みうる）を送らず unknown に丸めること
      mockExportToPdf.mockRejectedValueOnce("https://example.com/secret");
      renderButton();
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(mockTrackErrorOccurred).toHaveBeenCalledTimes(1);
      });
      expect(mockTrackErrorOccurred).toHaveBeenCalledWith("pdf_export", "unknown");
    });

    it("失敗しても finally でボタンが再び有効になり、文言が「PDF形式でダウンロード」に戻ること", async () => {
      // 意図: 失敗後に「PDF生成中...」のまま押せなくならないこと（finally の setIsLoading(false) が維持されている）
      mockExportToPdf.mockRejectedValueOnce(new Error("x"));
      renderButton();
      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockTrackErrorOccurred).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
      expect(button).toHaveTextContent("PDF形式でダウンロード");
    });

    it("失敗は console.error に「PDF export failed」と元のエラーで出力されること", async () => {
      // 意図: 計測に送るのは種類だけなので、開発者が原因を追えるよう元のエラーはコンソールに残すこと
      const error = new Error("x");
      mockExportToPdf.mockRejectedValueOnce(error);
      renderButton();
      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith("PDF export failed", error);
      });
    });
  });
});
