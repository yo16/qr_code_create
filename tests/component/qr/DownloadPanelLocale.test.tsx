import React from "react";
import { render, screen } from "@testing-library/react";
import { DownloadPanel } from "@/components/qr/DownloadPanel/DownloadPanel";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getClientMessages } from "@/i18n/getDict";

/**
 * DownloadPanel の locale 別表示（qr_code_create-01z.4）。
 * /poster に英語版は無いので、機能フラグが ON でも en ではポスター導線を出さない。
 */

jest.mock("@/lib/analytics/events", () => ({
  trackQrDownloaded: jest.fn(),
}));
jest.mock("@/lib/qr/canvasExporter", () => ({
  canvasToPng: jest.fn().mockReturnValue("data:image/png;base64,abc"),
  canvasToSvg: jest.fn().mockReturnValue("<svg></svg>"),
  downloadFile: jest.fn(),
}));
jest.mock("@/lib/handoff/posterHandoff", () => ({
  savePosterHandoff: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
// 機能フラグを ON にして、locale だけで出し分けていることを確かめる
jest.mock("@/lib/constants/features", () => ({
  FEATURE_FLAGS: { posterPage: true },
}));

const canvasRef = { current: null } as React.RefObject<HTMLCanvasElement | null>;

function renderPanel(locale: "ja" | "en") {
  return render(
    <I18nProvider locale={locale} messages={getClientMessages(locale)}>
      <DownloadPanel canvasRef={canvasRef} hasUtm={false} decorationCount={0} url="https://example.com" isUrlValid />
    </I18nProvider>
  );
}

describe("DownloadPanel の /poster 導線", () => {
  // 意図: en ではフラグ ON でもポスター導線が出ず、ボタンは英語
  it("en ではポスター導線が無く、ダウンロードボタンが英語", () => {
    const messages = getClientMessages("en");
    renderPanel("en");
    expect(screen.queryByRole("button", { name: messages.tool.download.posterCtaAria })).toBeNull();
    expect(screen.queryByText(messages.tool.download.posterCta)).toBeNull();
    expect(screen.getByRole("button", { name: /Download PNG/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download SVG/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download PDF/ })).toBeInTheDocument();
  });

  // 意図: ja ではフラグ ON のときポスター導線が出る（en の非表示が locale 由来であることの対照）
  it("ja ではポスター導線が出る", () => {
    const messages = getClientMessages("ja");
    renderPanel("ja");
    expect(screen.getByRole("button", { name: messages.tool.download.posterCtaAria })).toBeInTheDocument();
  });
});
