import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { PosterPreview } from "@/components/poster/PosterPreview/PosterPreview";
import { buildUtmUrl } from "@/lib/url/buildUtmUrl";
import type { DecorationConfig } from "@/types/qr";

// QrPreview のテストと同じく、jsdom に Canvas がないため qrcode をモックする
jest.mock("qrcode", () => ({
  toCanvas: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/qr/drawLogo", () => ({
  drawLogoOnCanvas: jest.fn().mockResolvedValue(undefined),
}));

import QRCode from "qrcode";
const mockToCanvas = QRCode.toCanvas as jest.Mock;

const decoration: DecorationConfig = {
  fgColor: "#000000",
  bgColor: "#ffffff",
  logo: null,
  frameType: null,
  caption: { text: "", fontSize: 16 },
  preset: null,
};

async function flushDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
}

describe("PosterPreview", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockToCanvas.mockClear();
    mockToCanvas.mockResolvedValue(undefined);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("説明文が表示されること", () => {
    render(
      <PosterPreview url="https://example.com" isUrlValid description="**おすすめ**" decoration={decoration} />
    );
    expect(screen.getByText("**おすすめ**")).toBeInTheDocument();
    expect(screen.queryByText("説明文を入力すると、ここに表示されます")).toBeNull();
  });

  it.each([
    ["空文字", ""],
    ["空白と改行だけ", "  \n\t "],
  ])("説明文が%sなら案内文が出ること", (_name, description) => {
    render(
      <PosterPreview url="https://example.com" isUrlValid description={description} decoration={decoration} />
    );
    expect(screen.getByText("説明文を入力すると、ここに表示されます")).toBeInTheDocument();
    expect(screen.queryByTestId("markdown-mock")).toBeNull();
  });

  it("カードが 1 枚のグループとして描画され、QR の canvas を含むこと", () => {
    render(
      <PosterPreview url="https://example.com" isUrlValid description="x" decoration={decoration} />
    );
    const card = screen.getByRole("group", { name: "ポスターのプレビュー（1枚分）" });
    expect(card.querySelector("canvas")).not.toBeNull();
  });

  it("有効な URL から QR コードが生成されること", async () => {
    render(
      <PosterPreview url="https://example.com" isUrlValid description="x" decoration={decoration} />
    );
    await flushDebounce();
    await waitFor(() => expect(mockToCanvas).toHaveBeenCalled());
    expect(mockToCanvas.mock.calls[0][1]).toBe("https://example.com");
  });

  it("UTM が付いた URL を渡すと、その URL がそのまま QR に渡ること", async () => {
    const utmUrl = buildUtmUrl(
      "https://example.com",
      { source: "poster", medium: "qr", campaign: "spring", term: "", content: "" },
      true
    );
    expect(utmUrl).toContain("utm_source=poster");

    render(<PosterPreview url={utmUrl} isUrlValid description="x" decoration={decoration} />);
    await flushDebounce();
    await waitFor(() => expect(mockToCanvas).toHaveBeenCalled());
    expect(mockToCanvas.mock.calls[0][1]).toBe(utmUrl);
  });

  it("URL が無効なら QR は生成されないこと", async () => {
    render(<PosterPreview url="" isUrlValid={false} description="x" decoration={decoration} />);
    await flushDebounce();
    expect(mockToCanvas).not.toHaveBeenCalled();
  });
});
