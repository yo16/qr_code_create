import React from "react";
import { render, screen, waitFor, act, within } from "@testing-library/react";
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

  it("説明文が 4 枚のカードすべてに表示されること", () => {
    render(
      <PosterPreview url="https://example.com" isUrlValid description="**おすすめ**" decoration={decoration} />
    );
    expect(screen.getAllByText("**おすすめ**")).toHaveLength(4);
    expect(screen.queryByText("説明文を入力すると、ここに表示されます")).toBeNull();
  });

  it.each([
    ["空文字", ""],
    ["空白と改行だけ", "  \n\t "],
  ])("説明文が%sなら案内文が 4 枚すべてに出ること", (_name, description) => {
    render(
      <PosterPreview url="https://example.com" isUrlValid description={description} decoration={decoration} />
    );
    expect(screen.getAllByText("説明文を入力すると、ここに表示されます")).toHaveLength(4);
    expect(screen.queryByTestId("markdown-mock")).toBeNull();
  });

  it("A4 の枠が 1 つのグループとして描画され、同じカードが 4 枚（各 QR の canvas つき）入っていること", () => {
    render(
      <PosterPreview url="https://example.com" isUrlValid description="x" decoration={decoration} />
    );
    const sheet = screen.getByRole("group", { name: "ポスターのプレビュー（A4縦、同じカード4枚）" });
    const cards = within(sheet).getAllByTestId("poster-card");
    expect(cards).toHaveLength(4);
    for (const card of cards) {
      expect(card.querySelector("canvas")).not.toBeNull();
    }
  });

  it("2〜4 枚目のカードだけが aria-hidden で、1 枚目は支援技術に読まれること", () => {
    render(
      <PosterPreview url="https://example.com" isUrlValid description="x" decoration={decoration} />
    );
    const cards = screen.getAllByTestId("poster-card");
    expect(cards[0]).not.toHaveAttribute("aria-hidden");
    expect(cards[1]).toHaveAttribute("aria-hidden", "true");
    expect(cards[2]).toHaveAttribute("aria-hidden", "true");
    expect(cards[3]).toHaveAttribute("aria-hidden", "true");
  });

  it("カードの中にラベル「QRコードプレビュー」やコントラスト警告が出ないこと（bare 表示）", () => {
    render(
      <PosterPreview
        url="https://example.com"
        isUrlValid
        description="x"
        decoration={{ ...decoration, fgColor: "#cccccc", bgColor: "#dddddd" }}
      />
    );
    expect(screen.queryByText("QRコードプレビュー")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("キャプションが有効な URL のときだけ 4 枚すべてに出ること", () => {
    const withCaption = { ...decoration, caption: { text: "ご来店ください", fontSize: 16 } };
    const { rerender } = render(
      <PosterPreview url="https://example.com" isUrlValid description="x" decoration={withCaption} />
    );
    expect(screen.getAllByText("ご来店ください")).toHaveLength(4);

    rerender(<PosterPreview url="" isUrlValid={false} description="x" decoration={withCaption} />);
    expect(screen.queryByText("ご来店ください")).toBeNull();
  });

  it("innerRef が A4 の枠の要素を指すこと", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <PosterPreview url="https://example.com" isUrlValid description="x" decoration={decoration} innerRef={ref} />
    );
    expect(ref.current).toBe(screen.getByRole("group", { name: /ポスターのプレビュー/ }));
  });

  it("有効な URL から QR コードが生成されること", async () => {
    render(
      <PosterPreview url="https://example.com" isUrlValid description="x" decoration={decoration} />
    );
    await flushDebounce();
    await waitFor(() => expect(mockToCanvas).toHaveBeenCalled());
    expect(mockToCanvas.mock.calls[0][1]).toBe("https://example.com");
  });

  it("同じ QR が 4 枚分（カードごとに 1 回ずつ）生成されること", async () => {
    render(
      <PosterPreview url="https://example.com" isUrlValid description="x" decoration={decoration} />
    );
    await flushDebounce();
    await waitFor(() => expect(mockToCanvas).toHaveBeenCalledTimes(4));
    for (const call of mockToCanvas.mock.calls) {
      expect(call[1]).toBe("https://example.com");
    }
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
