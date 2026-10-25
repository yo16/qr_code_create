import React from "react";
import { render, screen } from "@testing-library/react";
import { DownloadPanel } from "@/components/qr/DownloadPanel/DownloadPanel";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getClientMessages } from "@/i18n/getDict";

/**
 * 機能フラグをモックしない（既定値のまま）で、/poster の導線が公開されていることを確かめる
 * （qr_code_create-l1a）。フラグ OFF の挙動は DownloadPanel.flagOff.test.tsx が守る。
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

const canvasRef = { current: null } as React.RefObject<HTMLCanvasElement | null>;

function renderPanel(locale: "ja" | "en") {
  return render(
    <I18nProvider locale={locale} messages={getClientMessages(locale)}>
      <DownloadPanel canvasRef={canvasRef} hasUtm={false} decorationCount={0} url="https://example.com" isUrlValid />
    </I18nProvider>
  );
}

describe("DownloadPanel の /poster 導線（既定のフラグ）", () => {
  it("ja の /create では、フラグをモックしなくても導線ボタンが出ること", () => {
    const messages = getClientMessages("ja");
    renderPanel("ja");
    expect(screen.getByRole("button", { name: messages.tool.download.posterCtaAria })).toBeInTheDocument();
    expect(screen.getByText(messages.tool.download.posterCta)).toBeInTheDocument();
  });

  it("en では導線が出ないこと（/poster に英語版は無い）", () => {
    const messages = getClientMessages("en");
    renderPanel("en");
    expect(screen.queryByRole("button", { name: messages.tool.download.posterCtaAria })).toBeNull();
    expect(screen.queryByText(messages.tool.download.posterCta)).toBeNull();
  });
});
