import React from "react";
import { render, screen } from "@testing-library/react";
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

// CanvasRef ヘルパー
function makeCanvasRef(canvas?: HTMLCanvasElement | null) {
  return { current: canvas ?? null } as React.RefObject<HTMLCanvasElement | null>;
}

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

    it("PNGボタンとSVGボタンが両方とも button 要素として存在すること", () => {
      render(
        <DownloadPanel
          canvasRef={makeCanvasRef()}
          disabled={false}
          hasUtm={false}
          decorationCount={0}
        />
      );
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(2);
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
});
