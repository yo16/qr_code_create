import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import type { PosterHandoffPayload } from "@/types/poster";

// posterHandoff モック
const mockLoadPosterHandoff = jest.fn();
jest.mock("@/lib/handoff/posterHandoff", () => ({
  loadPosterHandoff: () => mockLoadPosterHandoff(),
}));

// generatePosterPdf モック
const mockGeneratePosterPdf = jest.fn().mockResolvedValue(new Blob(["pdf"]));
jest.mock("@/lib/pdf/generatePosterPdf", () => ({
  generatePosterPdf: (...args: unknown[]) => mockGeneratePosterPdf(...args),
}));

// validateUrl モック
const mockValidateUrl = jest.fn();
jest.mock("@/lib/url/validateUrl", () => ({
  validateUrl: (url: string) => mockValidateUrl(url),
}));

// PosterPreview 内の QrPreview が Canvas を使う。jsdom には Canvas がなく
// "Not implemented: getContext" のエラーが出るため、qrcode と drawLogo をモックする
jest.mock("qrcode", () => ({
  toCanvas: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/qr/drawLogo", () => ({
  drawLogoOnCanvas: jest.fn().mockResolvedValue(undefined),
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
  // URL が無効なとき QrPreview は canvas.getContext("2d") でクリアする。jsdom 未実装のエラーを避けるためスタブ化
  jest
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue({ clearRect: jest.fn() } as unknown as CanvasRenderingContext2D);
  mockLoadPosterHandoff.mockReset();
  mockGeneratePosterPdf.mockReset();
  mockGeneratePosterPdf.mockResolvedValue(new Blob(["pdf"]));
  // 保存処理（Blob URL と a 要素のクリック）は jsdom に無いのでスタブにする
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: jest.fn(() => "blob:mock") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: jest.fn() });
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  mockValidateUrl.mockReset();
  // デフォルトは無効なURL
  mockValidateUrl.mockReturnValue({ isValid: false });
});

const READY_LABEL = "PDFをダウンロード（A4印刷用）";
const DESC_LABEL = "説明文（Markdown）";

afterEach(() => {
  jest.useRealTimers();
});

/** 説明文を入力し、QR の 500ms デバウンスを流して 4 枚の描画完了（ready）まで進める */
async function typeDescriptionAndSettleQr(description = "## お店") {
  fireEvent.change(screen.getByLabelText(DESC_LABEL), { target: { value: description } });
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  await act(async () => {
    await Promise.resolve();
  });
}

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

    it("URL が有効で説明文があり、QR の描画が終わるとPDFボタンが有効化されること", async () => {
      jest.useFakeTimers();
      mockLoadPosterHandoff.mockReturnValue(null);
      mockValidateUrl.mockReturnValue({ isValid: true });

      render(<PosterEditor />);

      fireEvent.change(screen.getByLabelText("QRコードに埋め込むURL"), {
        target: { value: "https://valid.com" },
      });
      // 説明文がまだ空の間は押せない
      expect(screen.getByRole("button", { name: READY_LABEL })).toBeDisabled();

      await typeDescriptionAndSettleQr();

      expect(screen.getByRole("button", { name: READY_LABEL })).not.toBeDisabled();
    });
  });

  describe("PDFダウンロードボタン", () => {
    it("isUrlValid=false の場合は「PDFをダウンロード」ボタンが disabled で、URL のヒントが出ること", async () => {
      mockLoadPosterHandoff.mockReturnValue(null);
      mockValidateUrl.mockReturnValue({ isValid: false });

      render(<PosterEditor />);

      expect(await screen.findByRole("button", { name: READY_LABEL })).toBeDisabled();
      expect(screen.getByText("有効なURLを入力するとPDFをダウンロードできます")).toBeInTheDocument();
    });

    it("URL が有効でも説明文が空（空白だけを含む）なら disabled で、説明文のヒントが出ること", async () => {
      jest.useFakeTimers();
      mockLoadPosterHandoff.mockReturnValue(testPayload);
      mockValidateUrl.mockReturnValue({ isValid: true });

      render(<PosterEditor />);
      await typeDescriptionAndSettleQr("  \n ");

      expect(screen.getByRole("button", { name: READY_LABEL })).toBeDisabled();
      expect(screen.getByText("説明文を入力するとPDFをダウンロードできます")).toBeInTheDocument();
    });

    it("QR の描画が終わるまでは「QRコードを準備中...」で無効であること", async () => {
      jest.useFakeTimers();
      mockLoadPosterHandoff.mockReturnValue(testPayload);
      mockValidateUrl.mockReturnValue({ isValid: true });

      render(<PosterEditor />);
      // 説明文は入れるが、デバウンスはまだ流さない
      fireEvent.change(screen.getByLabelText(DESC_LABEL), { target: { value: "説明" } });

      expect(screen.getByRole("button", { name: "QRコードを準備中..." })).toBeDisabled();

      await act(async () => {
        jest.advanceTimersByTime(500);
      });
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.getByRole("button", { name: READY_LABEL })).not.toBeDisabled();
    });

    it("ボタンクリックで generatePosterPdf がプレビューの A4 の枠を previewElement として呼ばれること", async () => {
      jest.useFakeTimers();
      mockLoadPosterHandoff.mockReturnValue(testPayload);
      mockValidateUrl.mockReturnValue({ isValid: true });

      render(<PosterEditor />);
      await typeDescriptionAndSettleQr();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: READY_LABEL }));
      });

      expect(mockGeneratePosterPdf).toHaveBeenCalledTimes(1);
      const { previewElement } = mockGeneratePosterPdf.mock.calls[0][0];
      expect(previewElement).toBe(
        screen.getByRole("group", { name: "ポスターのプレビュー（A4縦、同じカード4枚）" })
      );
    });

    it("生成中（isGenerating=true）はボタンが「生成中...」表示かつ aria-busy=true で無効であること", async () => {
      jest.useFakeTimers();
      mockLoadPosterHandoff.mockReturnValue(testPayload);
      mockValidateUrl.mockReturnValue({ isValid: true });

      // PDF生成を pending 状態にするため、resolve しない Promise を返す
      let resolvePdf!: (blob: Blob) => void;
      mockGeneratePosterPdf.mockReturnValue(
        new Promise<Blob>((resolve) => {
          resolvePdf = resolve;
        })
      );

      render(<PosterEditor />);
      await typeDescriptionAndSettleQr();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: READY_LABEL }));
      });

      const button = screen.getByRole("button", { name: "生成中..." });
      expect(button).toHaveAttribute("aria-busy", "true");
      expect(button).toBeDisabled();

      // 解決後の state 更新を act 内で流して警告を防ぐ
      await act(async () => {
        resolvePdf(new Blob(["pdf"]));
      });
    });
  });

  describe("コントラスト警告", () => {
    it("色のコントラストが足りないとき、プレビューの上に 1 回だけ出ること（カードごとには出ない）", async () => {
      mockLoadPosterHandoff.mockReturnValue({
        ...testPayload,
        decoration: { ...testPayload.decoration, fgColor: "#cccccc", bgColor: "#dddddd" },
      });
      mockValidateUrl.mockReturnValue({ isValid: true });

      render(<PosterEditor />);

      const alerts = await screen.findAllByRole("alert");
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toHaveTextContent("コントラスト");
    });

    it("コントラストが十分なら出ないこと", async () => {
      mockLoadPosterHandoff.mockReturnValue(testPayload);
      mockValidateUrl.mockReturnValue({ isValid: true });

      render(<PosterEditor />);

      await screen.findByRole("button", { name: /PDF|QRコードを準備中/ });
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });
});
