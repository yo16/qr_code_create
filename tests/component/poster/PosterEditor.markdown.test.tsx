import React from "react";
import { render, screen, waitFor, fireEvent, act, within } from "@testing-library/react";
import { PosterEditor } from "@/components/poster/PosterEditor/PosterEditor";
import { savePosterHandoff } from "@/lib/handoff/posterHandoff";
import { FRAME_OPTIONS } from "@/lib/qr/frameRenderer";
import type { PosterHandoffPayload } from "@/types/poster";

// 既存の PosterEditor.test.tsx は handoff / validateUrl をモックしている。
// こちらは Markdown 入力とプレビューの結合を見るため、handoff（sessionStorage）と validateUrl は実物を使う。
// jsdom に Canvas がないため qrcode だけモックし、QR に渡る URL を検証に使う。
jest.mock("qrcode", () => ({
  toCanvas: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/qr/drawLogo", () => ({
  drawLogoOnCanvas: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/pdf/generatePosterPdf", () => ({
  generatePosterPdf: jest.fn().mockResolvedValue(new Blob(["pdf"])),
}));

import QRCode from "qrcode";
const mockToCanvas = QRCode.toCanvas as jest.Mock;

type Payload = Omit<PosterHandoffPayload, "savedAt">;

const payload: Payload = {
  url: "https://example.com/from-handoff",
  isUrlValid: true,
  utm: { source: "poster", medium: "qr", campaign: "spring", term: "", content: "" },
  utmEnabled: true,
  decoration: {
    fgColor: "#112233",
    bgColor: "#eeeeee",
    logo: null,
    frameType: "simple",
    caption: { text: "ご来店ください", fontSize: 16 },
    preset: null,
  },
};

const URL_LABEL = "QRコードに埋め込むURL";
const DESC_LABEL = "説明文（Markdown）";
const PREVIEW_NAME = "ポスターのプレビュー（A4縦、同じカード4枚）";
const PDF_BUTTON = { name: "PDFをダウンロード（A4印刷用）" };

async function renderEditor() {
  render(<PosterEditor />);
  await waitFor(() => expect(screen.getByLabelText(URL_LABEL)).toBeInTheDocument());
}

async function flushDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
}

function lastQrUrl(): string {
  const calls = mockToCanvas.mock.calls;
  return calls[calls.length - 1][1];
}

beforeEach(() => {
  sessionStorage.clear();
  mockToCanvas.mockClear();
  mockToCanvas.mockResolvedValue(undefined);
});

describe("PosterEditor（Markdown 説明文）", () => {
  describe("引き継ぎなし", () => {
    it("URL 入力・UTM・装飾の要約・説明文入力・プレビュー・ダウンロードの全 UI が出ること", async () => {
      await renderEditor();

      expect(screen.getByLabelText(URL_LABEL)).toHaveValue("");
      expect(screen.getByRole("switch")).toBeInTheDocument(); // UtmBuilder のトグル
      expect(screen.getByLabelText("適用される装飾")).toHaveTextContent("適用される装飾:");
      expect(screen.getByLabelText(DESC_LABEL)).toHaveValue("");
      expect(screen.getByRole("heading", { name: "プレビュー" })).toBeInTheDocument();
      expect(screen.getByRole("group", { name: PREVIEW_NAME })).toBeInTheDocument();
      expect(screen.getByRole("button", PDF_BUTTON)).toBeDisabled();
    });

    it("説明文が空の間はプレビューの 4 枚すべてに案内文が出ること", async () => {
      await renderEditor();
      expect(screen.getAllByText("説明文を入力すると、ここに表示されます")).toHaveLength(4);
    });

    it("「準備中」の仮の文言が残っていないこと", async () => {
      await renderEditor();
      expect(document.body.textContent).not.toContain("準備中");
    });
  });

  describe("入力とプレビューの連動", () => {
    it("説明文を入力するとプレビューに反映され、案内文が消えること", async () => {
      await renderEditor();

      fireEvent.change(screen.getByLabelText(DESC_LABEL), {
        target: { value: "## お店の名前" },
      });

      const sheet = screen.getByRole("group", { name: PREVIEW_NAME });
      // react-markdown はモックで原文をそのまま表示する。同じカードが 4 枚ある
      expect(within(sheet).getAllByText("## お店の名前")).toHaveLength(4);
      expect(screen.queryByText("説明文を入力すると、ここに表示されます")).toBeNull();
    });

    it("URL と説明文を入力し QR の描画が終わると PDF ボタンが有効になり、QR がその URL で生成されること", async () => {
      jest.useFakeTimers();
      try {
        await renderEditor();

        fireEvent.change(screen.getByLabelText(URL_LABEL), {
          target: { value: "https://example.com/new" },
        });
        // 説明文が空の間は URL が有効でも押せない
        expect(screen.getByRole("button", PDF_BUTTON)).toBeDisabled();
        fireEvent.change(screen.getByLabelText(DESC_LABEL), { target: { value: "説明" } });
        await flushDebounce();

        await waitFor(() => expect(mockToCanvas).toHaveBeenCalled());
        expect(lastQrUrl()).toContain("https://example.com/new");
        await waitFor(() => expect(screen.getByRole("button", PDF_BUTTON)).not.toBeDisabled());
      } finally {
        jest.useRealTimers();
      }
    });

    it("説明文を消す（空白だけにする）とボタンが再び無効になること", async () => {
      jest.useFakeTimers();
      try {
        await renderEditor();
        fireEvent.change(screen.getByLabelText(URL_LABEL), {
          target: { value: "https://example.com/new" },
        });
        fireEvent.change(screen.getByLabelText(DESC_LABEL), { target: { value: "説明" } });
        await flushDebounce();
        await waitFor(() => expect(screen.getByRole("button", PDF_BUTTON)).not.toBeDisabled());

        fireEvent.change(screen.getByLabelText(DESC_LABEL), { target: { value: "   " } });

        expect(screen.getByRole("button", PDF_BUTTON)).toBeDisabled();
        expect(screen.getByText("説明文を入力するとPDFをダウンロードできます")).toBeInTheDocument();
      } finally {
        jest.useRealTimers();
      }
    });

    it("無効な URL では警告ヒントが出て PDF ボタンが無効のままであること", async () => {
      await renderEditor();

      fireEvent.change(screen.getByLabelText(URL_LABEL), { target: { value: "not a url" } });

      expect(screen.getByText(/有効なURLを入力してください/)).toBeInTheDocument();
      expect(screen.getByRole("button", PDF_BUTTON)).toBeDisabled();
    });
  });

  describe("引き継ぎ state の復元", () => {
    it("url と装飾の要約（色・フレーム・キャプション）が復元されること", async () => {
      savePosterHandoff(payload);

      await renderEditor();

      expect(screen.getByLabelText(URL_LABEL)).toHaveValue(payload.url);
      const frameLabel = FRAME_OPTIONS.find((o) => o.type === "simple")!.label;
      const summary = screen.getByLabelText("適用される装飾");
      expect(summary).toHaveTextContent("#112233");
      expect(summary).toHaveTextContent("#eeeeee");
      expect(summary).toHaveTextContent(`フレーム（${frameLabel}）`);
      expect(summary).toHaveTextContent("キャプション（ご来店ください）");
    });

    it("utmEnabled=true の引き継ぎでトグルが ON になり、QR に UTM 付き URL が渡ること", async () => {
      jest.useFakeTimers();
      try {
        savePosterHandoff(payload);

        await renderEditor();
        await flushDebounce();

        expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
        await waitFor(() => expect(mockToCanvas).toHaveBeenCalled());
        const qrUrl = lastQrUrl();
        expect(qrUrl).toContain("utm_source=poster");
        expect(qrUrl).toContain("utm_medium=qr");
        expect(qrUrl).toContain("utm_campaign=spring");
      } finally {
        jest.useRealTimers();
      }
    });

    it("utmEnabled=false の引き継ぎではトグルが OFF で、QR に UTM が付かないこと", async () => {
      jest.useFakeTimers();
      try {
        savePosterHandoff({ ...payload, utmEnabled: false });

        await renderEditor();
        await flushDebounce();

        expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
        await waitFor(() => expect(mockToCanvas).toHaveBeenCalled());
        expect(lastQrUrl()).not.toContain("utm_");
      } finally {
        jest.useRealTimers();
      }
    });

    it("装飾がフレームなし・ロゴなし・キャプション空なら色だけが要約に出ること", async () => {
      savePosterHandoff({
        ...payload,
        decoration: { ...payload.decoration, frameType: null, caption: { text: "  ", fontSize: 16 } },
      });

      await renderEditor();

      const summary = screen.getByLabelText("適用される装飾");
      expect(summary).toHaveTextContent("色（#112233 / #eeeeee）");
      expect(summary.textContent).not.toContain("フレーム");
      expect(summary.textContent).not.toContain("キャプション");
      expect(summary.textContent).not.toContain("ロゴ");
    });

    it("引き継ぎがあっても説明文は空から始まること", async () => {
      savePosterHandoff(payload);
      await renderEditor();
      expect(screen.getByLabelText(DESC_LABEL)).toHaveValue("");
    });
  });
});
