import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DownloadPanel } from "@/components/qr/DownloadPanel/DownloadPanel";

// analytics モック
jest.mock("@/lib/analytics/events", () => ({
  trackQrDownloaded: jest.fn(),
}));

// canvasExporter モック
jest.mock("@/lib/qr/canvasExporter", () => ({
  canvasToPng: jest.fn().mockReturnValue("data:image/png;base64,abc123"),
  canvasToSvg: jest.fn().mockReturnValue('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"></svg>'),
  downloadFile: jest.fn(),
}));

// posterHandoff モック
const mockSavePosterHandoff = jest.fn();
jest.mock("@/lib/handoff/posterHandoff", () => ({
  savePosterHandoff: (...args: unknown[]) => mockSavePosterHandoff(...args),
}));

// next/navigation useRouter モック
const mockRouterPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// 機能フラグ モック（ON）
// 既定値は false（未完成の /poster を隠す）だが、このファイルの「ポスター作成CTA」describe は
// フラグ ON 時の挙動を検証するため明示的に true にする。OFF 時の挙動は DownloadPanel.flagOff.test.tsx で検証する
jest.mock("@/lib/constants/features", () => ({
  FEATURE_FLAGS: { posterPage: true },
}));

// CanvasRef ヘルパー
function makeCanvasRef(canvas?: HTMLCanvasElement | null) {
  return { current: canvas ?? null } as React.RefObject<HTMLCanvasElement | null>;
}

// テスト用のデコレーション設定
const testDecoration = {
  fgColor: "#000000",
  bgColor: "#ffffff",
  logo: null,
  frameType: null,
  caption: { text: "", fontSize: 14 },
  preset: null,
};

// テスト用のUTMパラメータ
const testUtm = { source: "test", medium: "qr", campaign: "c1", term: "", content: "" };

beforeEach(() => {
  mockSavePosterHandoff.mockClear();
  mockRouterPush.mockClear();
});

describe("DownloadPanel", () => {
  describe("disabled=true の場合", () => {
    it("「QRコードを生成するとダウンロードできます」メッセージが表示されること", () => {
      render(
        <DownloadPanel
          canvasRef={makeCanvasRef()}
          disabled={true}
          hasUtm={false}
          decorationCount={0}
        />
      );
      expect(
        screen.getByText("QRコードを生成するとダウンロードできます")
      ).toBeInTheDocument();
    });

    it("PNGボタンが表示されないこと", () => {
      render(
        <DownloadPanel
          canvasRef={makeCanvasRef()}
          disabled={true}
          hasUtm={false}
          decorationCount={0}
        />
      );
      expect(screen.queryByText("PNG形式でダウンロード")).not.toBeInTheDocument();
    });

    it("SVGボタンが表示されないこと", () => {
      render(
        <DownloadPanel
          canvasRef={makeCanvasRef()}
          disabled={true}
          hasUtm={false}
          decorationCount={0}
        />
      );
      expect(screen.queryByText("SVG形式でダウンロード")).not.toBeInTheDocument();
    });
  });

  describe("disabled=false の場合", () => {
    it("「PNG形式でダウンロード」ボタンが表示されること", () => {
      render(
        <DownloadPanel
          canvasRef={makeCanvasRef()}
          disabled={false}
          hasUtm={false}
          decorationCount={0}
        />
      );
      expect(screen.getByText("PNG形式でダウンロード")).toBeInTheDocument();
    });

    it("「SVG形式でダウンロード」ボタンが表示されること", () => {
      render(
        <DownloadPanel
          canvasRef={makeCanvasRef()}
          disabled={false}
          hasUtm={false}
          decorationCount={0}
        />
      );
      expect(screen.getByText("SVG形式でダウンロード")).toBeInTheDocument();
    });

    it("無効メッセージが表示されないこと", () => {
      render(
        <DownloadPanel
          canvasRef={makeCanvasRef()}
          disabled={false}
          hasUtm={false}
          decorationCount={0}
        />
      );
      expect(
        screen.queryByText("QRコードを生成するとダウンロードできます")
      ).not.toBeInTheDocument();
    });

    it("PNG/SVG/PDFボタンが button 要素として存在すること", () => {
      render(
        <DownloadPanel
          canvasRef={makeCanvasRef()}
          disabled={false}
          hasUtm={false}
          decorationCount={0}
        />
      );
      // PNG/SVG/PDF の3つのダウンロードボタンが存在することを確認
      expect(screen.getByText("PNG形式でダウンロード")).toBeInTheDocument();
      expect(screen.getByText("SVG形式でダウンロード")).toBeInTheDocument();
      expect(screen.getByText("PDF形式でダウンロード")).toBeInTheDocument();
    });
  });

  describe("disabled デフォルト値（省略時）", () => {
    it("disabled を省略した場合はボタンが表示されること（デフォルト false）", () => {
      render(
        <DownloadPanel
          canvasRef={makeCanvasRef()}
          hasUtm={false}
          decorationCount={0}
        />
      );
      expect(screen.getByText("PNG形式でダウンロード")).toBeInTheDocument();
      expect(screen.getByText("SVG形式でダウンロード")).toBeInTheDocument();
    });
  });

  describe("ポスター作成CTA", () => {
    it("「印刷用ポスターを作る →」ボタンが表示されること", () => {
      render(
        <DownloadPanel
          canvasRef={makeCanvasRef()}
          disabled={false}
          hasUtm={false}
          decorationCount={0}
        />
      );
      expect(screen.getByText("印刷用ポスターを作る →")).toBeInTheDocument();
    });

    it("ボタンクリックで savePosterHandoff が url/utm/utmEnabled/decoration を含む正しい payload で呼ばれること", () => {
      render(
        <DownloadPanel
          canvasRef={makeCanvasRef()}
          disabled={false}
          hasUtm={false}
          decorationCount={0}
          url="https://example.com"
          isUrlValid={true}
          utm={testUtm}
          utmEnabled={true}
          decoration={testDecoration}
        />
      );

      fireEvent.click(screen.getByText("印刷用ポスターを作る →"));

      expect(mockSavePosterHandoff).toHaveBeenCalledTimes(1);
      expect(mockSavePosterHandoff).toHaveBeenCalledWith({
        url: "https://example.com",
        isUrlValid: true,
        utm: testUtm,
        utmEnabled: true,
        decoration: testDecoration,
      });
    });

    it("ボタンクリックで useRouter().push(\"/poster\") が呼ばれること", () => {
      render(
        <DownloadPanel
          canvasRef={makeCanvasRef()}
          disabled={false}
          hasUtm={false}
          decorationCount={0}
          url="https://example.com"
          isUrlValid={true}
        />
      );

      fireEvent.click(screen.getByText("印刷用ポスターを作る →"));

      expect(mockRouterPush).toHaveBeenCalledTimes(1);
      expect(mockRouterPush).toHaveBeenCalledWith("/poster");
    });

    it("disabled=true の場合は CTAボタンも表示されないこと", () => {
      render(
        <DownloadPanel
          canvasRef={makeCanvasRef()}
          disabled={true}
          hasUtm={false}
          decorationCount={0}
        />
      );
      expect(screen.queryByText("印刷用ポスターを作る →")).not.toBeInTheDocument();
    });

    it("isUrlValid=false の場合は CTAボタンが disabled になること", () => {
      render(
        <DownloadPanel
          canvasRef={makeCanvasRef()}
          disabled={false}
          hasUtm={false}
          decorationCount={0}
          url="https://example.com"
          isUrlValid={false}
        />
      );

      const ctaButton = screen.getByText("印刷用ポスターを作る →");
      expect(ctaButton).toBeDisabled();
    });

    it("isUrlValid=false の場合はCTAクリックしても savePosterHandoff と router.push が呼ばれないこと", () => {
      render(
        <DownloadPanel
          canvasRef={makeCanvasRef()}
          disabled={false}
          hasUtm={false}
          decorationCount={0}
          url="https://example.com"
          isUrlValid={false}
        />
      );

      fireEvent.click(screen.getByText("印刷用ポスターを作る →"));

      expect(mockSavePosterHandoff).not.toHaveBeenCalled();
      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });
});
