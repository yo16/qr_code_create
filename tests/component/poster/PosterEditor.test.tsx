import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import type { PosterHandoffPayload } from "@/types/poster";

// posterHandoff モック
const mockLoadPosterHandoff = jest.fn();
jest.mock("@/lib/handoff/posterHandoff", () => ({
  loadPosterHandoff: () => mockLoadPosterHandoff(),
}));

// generatePosterPdf モック
const mockGeneratePosterPdf = jest.fn().mockResolvedValue(undefined);
jest.mock("@/lib/pdf/generatePosterPdf", () => ({
  generatePosterPdf: (...args: unknown[]) => mockGeneratePosterPdf(...args),
}));

// validateUrl モック
const mockValidateUrl = jest.fn();
jest.mock("@/lib/url/validateUrl", () => ({
  validateUrl: (url: string) => mockValidateUrl(url),
}));

// PosterEditor は依存モックセットアップ後にインポート
import { PosterEditor } from "@/components/poster/PosterEditor/PosterEditor";

// テスト用の handoff payload
const testPayload: PosterHandoffPayload = {
  url: "https://example.com/from-handoff",
  isUrlValid: true,
  utm: { source: "test", medium: "qr", campaign: "c1", term: "", content: "" },
  utmEnabled: true,
  decoration: {
    fgColor: "#111111",
    bgColor: "#eeeeee",
    logo: null,
    frameType: null,
    caption: { text: "テスト", fontSize: 16 },
    preset: null,
  },
  savedAt: new Date().toISOString(),
};

beforeEach(() => {
  mockLoadPosterHandoff.mockReset();
  mockGeneratePosterPdf.mockReset();
  mockGeneratePosterPdf.mockResolvedValue(undefined);
  mockValidateUrl.mockReset();
  // デフォルトは無効なURL
  mockValidateUrl.mockReturnValue({ isValid: false });
});

describe("PosterEditor", () => {
  describe("初期表示", () => {
    it("サーバー描画（getServerSnapshot 経路）ではローディング表示のみで、フォームも handoff 読み込みも行われないこと", () => {
      // PosterEditor は useSyncExternalStore でクライアント判定している。
      // サーバー描画・ハイドレーション時は getServerSnapshot（false）が使われ
      // 「読み込み中...」だけを返し、sessionStorage を読む createInitialState は呼ばれない。
      // RTL の render() はクライアント経路（getSnapshot=true）で即フォームになるため、
      // サーバー経路は react-dom/server の renderToString で検証する。
      mockLoadPosterHandoff.mockReturnValue(testPayload);

      const html = renderToString(<PosterEditor />);

      // ローディング表示が出ること（aria-live で読み上げ対象）
      expect(html).toContain("読み込み中...");
      expect(html).toContain('aria-live="polite"');
      // フォーム（URL 入力・ダウンロードボタン）はサーバー描画に含まれないこと
      expect(html).not.toContain("QRコードに埋め込むURL");
      expect(html).not.toContain('id="poster-url"');
      expect(html).not.toContain("PDFをダウンロード");
      // サーバー経路では sessionStorage を読む loadPosterHandoff が呼ばれないこと
      expect(mockLoadPosterHandoff).not.toHaveBeenCalled();
    });

    it("handoff 読み込み後にフォームが表示されること", async () => {
      mockLoadPosterHandoff.mockReturnValue(null);

      render(<PosterEditor />);

      await waitFor(() => {
        expect(screen.getByLabelText("QRコードに埋め込むURL")).toBeInTheDocument();
      });
    });
  });

  describe("handoff からの状態復元", () => {
    it("loadPosterHandoff が payload を返すと URL 欄に値がセットされること", async () => {
      mockLoadPosterHandoff.mockReturnValue(testPayload);
      mockValidateUrl.mockReturnValue({ isValid: true });

      render(<PosterEditor />);

      await waitFor(() => {
        const urlInput = screen.getByLabelText(
          "QRコードに埋め込むURL"
        ) as HTMLInputElement;
        expect(urlInput.value).toBe("https://example.com/from-handoff");
      });
    });

    it("loadPosterHandoff が null を返すと URL 欄は空であること", async () => {
      mockLoadPosterHandoff.mockReturnValue(null);

      render(<PosterEditor />);

      await waitFor(() => {
        const urlInput = screen.getByLabelText(
          "QRコードに埋め込むURL"
        ) as HTMLInputElement;
        expect(urlInput.value).toBe("");
      });
    });
  });

  describe("URL 入力", () => {
    it("URL 入力で validateUrl が呼ばれること", async () => {
      mockLoadPosterHandoff.mockReturnValue(null);
      mockValidateUrl.mockReturnValue({ isValid: true });

      render(<PosterEditor />);

      await waitFor(() => {
        expect(screen.getByLabelText("QRコードに埋め込むURL")).toBeInTheDocument();
      });

      const urlInput = screen.getByLabelText("QRコードに埋め込むURL");
      fireEvent.change(urlInput, { target: { value: "https://test.com" } });

      expect(mockValidateUrl).toHaveBeenCalledWith("https://test.com");
    });

    it("validateUrl が isValid=true を返すと isUrlValid 状態が true になること（PDFボタンが有効化される）", async () => {
      mockLoadPosterHandoff.mockReturnValue(null);
      mockValidateUrl.mockReturnValue({ isValid: true });

      render(<PosterEditor />);

      await waitFor(() => {
        expect(screen.getByLabelText("QRコードに埋め込むURL")).toBeInTheDocument();
      });

      const urlInput = screen.getByLabelText("QRコードに埋め込むURL");
      fireEvent.change(urlInput, { target: { value: "https://valid.com" } });

      await waitFor(() => {
        const downloadButton = screen.getByText("PDFをダウンロード");
        expect(downloadButton).not.toBeDisabled();
      });
    });
  });

  describe("PDFダウンロードボタン", () => {
    it("isUrlValid=false の場合は「PDFをダウンロード」ボタンが disabled であること", async () => {
      mockLoadPosterHandoff.mockReturnValue(null);
      mockValidateUrl.mockReturnValue({ isValid: false });

      render(<PosterEditor />);

      await waitFor(() => {
        const button = screen.getByText("PDFをダウンロード");
        expect(button).toBeDisabled();
      });
    });

    it("ボタンクリックで generatePosterPdf が現在の state を引数で呼ばれること", async () => {
      mockLoadPosterHandoff.mockReturnValue(testPayload);
      mockValidateUrl.mockReturnValue({ isValid: true });

      render(<PosterEditor />);

      await waitFor(() => {
        const button = screen.getByText("PDFをダウンロード");
        expect(button).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText("PDFをダウンロード"));

      await waitFor(() => {
        expect(mockGeneratePosterPdf).toHaveBeenCalledTimes(1);
      });

      // generatePosterPdf に渡される state の url が handoff から復元された値であること
      const calledState = mockGeneratePosterPdf.mock.calls[0][0];
      expect(calledState.url).toBe(testPayload.url);
      expect(calledState.isUrlValid).toBe(true);
    });

    it("生成中（isGenerating=true）はボタンが「生成中...」表示かつ aria-busy=true であること", async () => {
      mockLoadPosterHandoff.mockReturnValue(testPayload);
      mockValidateUrl.mockReturnValue({ isValid: true });

      // PDF生成を pending 状態にするため、resolve しない Promise を返す
      let resolvePdf!: () => void;
      mockGeneratePosterPdf.mockReturnValue(
        new Promise<void>((resolve) => {
          resolvePdf = resolve;
        })
      );

      render(<PosterEditor />);

      await waitFor(() => {
        const button = screen.getByText("PDFをダウンロード");
        expect(button).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText("PDFをダウンロード"));

      await waitFor(() => {
        const button = screen.getByText("生成中...");
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute("aria-busy", "true");
        expect(button).toBeDisabled();
      });

      // Promise を解決してクリーンアップ
      resolvePdf();
    });
  });
});
