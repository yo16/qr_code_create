import React from "react";
import { render, screen } from "@testing-library/react";
import { DownloadPanel } from "@/components/qr/DownloadPanel/DownloadPanel";

// DownloadPanel.test.tsx は FEATURE_FLAGS.posterPage=true でポスター作成CTAを検証している。
// jest.mock はファイル単位で固定されるため、フラグ OFF の挙動はこのファイルに分離して検証する。

// analytics モック
jest.mock("@/lib/analytics/events", () => ({
  trackQrDownloaded: jest.fn(),
}));

// canvasExporter モック
jest.mock("@/lib/qr/canvasExporter", () => ({
  canvasToPng: jest.fn().mockReturnValue("data:image/png;base64,abc123"),
  canvasToSvg: jest
    .fn()
    .mockReturnValue('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"></svg>'),
  downloadFile: jest.fn(),
}));

// posterHandoff モック
jest.mock("@/lib/handoff/posterHandoff", () => ({
  savePosterHandoff: jest.fn(),
}));

// next/navigation useRouter モック
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// 機能フラグ モック（OFF）
jest.mock("@/lib/constants/features", () => ({
  FEATURE_FLAGS: { posterPage: false },
}));

// CanvasRef ヘルパー
function makeCanvasRef(canvas?: HTMLCanvasElement | null) {
  return { current: canvas ?? null } as React.RefObject<HTMLCanvasElement | null>;
}

describe("DownloadPanel ポスター作成CTA（機能フラグ OFF）", () => {
  it("FEATURE_FLAGS.posterPage=false のとき「印刷用ポスターを作る →」ボタンが描画されないこと", () => {
    // 意図: 未完成の /poster への導線を本番で露出させない（disabled=false・URL有効でも描画しない）
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
    expect(screen.queryByText("印刷用ポスターを作る →")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "印刷用ポスターを作る（/posterページへ移動）" })
    ).not.toBeInTheDocument();
  });

  it("FEATURE_FLAGS.posterPage=false でもダウンロードボタン（PNG/SVG）は従来どおり表示されること", () => {
    // 意図: フラグが CTA 以外の表示（本来のダウンロード機能）に影響しないことを保証する
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
    expect(screen.getByText("PNG形式でダウンロード")).toBeInTheDocument();
    expect(screen.getByText("SVG形式でダウンロード")).toBeInTheDocument();
  });
});
