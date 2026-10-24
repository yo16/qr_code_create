import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QrGenerator } from "@/components/qr/QrGenerator/QrGenerator";
import type { CaptionConfig, LogoConfig } from "@/types/qr";
import type { DecorationPreset } from "@/lib/constants/decorationPresets";
import { trackPresetSelected, trackUtmSet } from "@/lib/analytics/events";

// GA イベント送信をモック（URL 由来の初期適用でイベントが飛ばないことを検証するため）
jest.mock("@/lib/analytics/events");

// 子コンポーネントをモック
jest.mock("@/components/qr/UrlInput/UrlInput", () => ({
  UrlInput: ({
    value,
    onChange,
    onValidationChange,
  }: {
    value: string;
    onChange: (value: string) => void;
    onValidationChange?: (isValid: boolean) => void;
  }) => (
    <div data-testid="url-input">
      <input
        data-testid="url-field"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
      <button
        data-testid="validate-btn"
        onClick={() => onValidationChange?.(true)}
      >
        validate
      </button>
      <button
        data-testid="invalidate-btn"
        onClick={() => onValidationChange?.(false)}
      >
        invalidate
      </button>
    </div>
  ),
}));

jest.mock("@/components/qr/UtmBuilder/UtmBuilder", () => ({
  UtmBuilder: ({
    values,
    onChange,
    enabled,
    onEnabledChange,
  }: {
    values: Record<string, string>;
    onChange: (values: Record<string, string>) => void;
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
  }) => (
    <div
      data-testid="utm-builder"
      data-enabled={enabled ? "true" : "false"}
      data-source={values.source}
      data-medium={values.medium}
    >
      <button
        data-testid="set-utm"
        onClick={() => onChange({ ...values, source: "flyer" })}
      >
        set utm
      </button>
      <button
        data-testid="toggle-utm-off"
        onClick={() => onEnabledChange(false)}
      >
        toggle utm off
      </button>
      <button
        data-testid="toggle-utm-on"
        onClick={() => onEnabledChange(true)}
      >
        toggle utm on
      </button>
    </div>
  ),
}));

jest.mock("@/components/qr/UrlPreview/UrlPreview", () => ({
  UrlPreview: (props: { url: string; utmEnabled?: boolean }) => (
    <div
      data-testid="url-preview"
      data-utm-enabled={props.utmEnabled !== undefined ? String(props.utmEnabled) : "undefined"}
    >
      {props.url}
    </div>
  ),
}));

jest.mock("@/components/qr/QrPreview/QrPreview", () => ({
  QrPreview: (props: { url: string; logo?: LogoConfig | null }) => (
    <div
      data-testid="qr-preview"
      data-logo={props.logo ? JSON.stringify(props.logo) : "null"}
    >
      {props.url}
    </div>
  ),
}));

jest.mock("@/components/ui/ProgressBar/ProgressBar", () => ({
  ProgressBar: ({ current, message }: { current: number; message?: string }) => (
    <div data-testid="progress-bar" data-current={current}>
      {message}
    </div>
  ),
}));

jest.mock("@/components/qr/DecorationPanel/ColorCustomizer", () => ({
  ColorCustomizer: ({ fgColor, bgColor }: { fgColor: string; bgColor: string }) => (
    <div data-testid="color-customizer" data-fg-color={fgColor} data-bg-color={bgColor} />
  ),
}));

jest.mock("@/components/qr/DecorationPanel/FrameSelector", () => ({
  FrameSelector: ({ frame }: { frame?: { type?: string; color?: string } }) => (
    <div data-testid="frame-selector" data-frame-type={frame?.type || "none"} data-frame-color={frame?.color || "#000000"} />
  ),
}));

jest.mock("@/components/qr/DownloadPanel/DownloadPanel", () => ({
  DownloadPanel: ({ disabled, decorationCount }: { disabled: boolean; decorationCount: number }) => (
    <div
      data-testid="download-panel"
      data-disabled={disabled ? "true" : "false"}
      data-decoration-count={decorationCount}
    />
  ),
}));

jest.mock("@/components/qr/DecorationPanel/PresetSelector", () => ({
  PresetSelector: ({
    currentPresetId,
    onApplyPreset,
  }: {
    currentPresetId?: string | null;
    onApplyPreset: (preset: DecorationPreset) => void;
  }) => (
    <div data-testid="preset-selector" data-current-preset={currentPresetId || "none"}>
      <button
        data-testid="apply-preset-business"
        onClick={() => onApplyPreset({
          id: "business",
          name: "ビジネス",
          description: "信頼感のある落ち着いたデザイン",
          fgColor: "#1a365d",
          bgColor: "#ffffff",
          frameType: "business",
          frameColor: "#1a365d",
          caption: { text: "詳しくはこちら", fontSize: 12 },
        })}
      >
        apply business
      </button>
      <button
        data-testid="apply-preset-simple"
        onClick={() => onApplyPreset({
          id: "simple",
          name: "シンプル",
          description: "白黒でクリーンなデザイン",
          fgColor: "#000000",
          bgColor: "#ffffff",
          frameType: "none",
          frameColor: "#000000",
          caption: { text: "", fontSize: 14 },
        })}
      >
        apply simple
      </button>
    </div>
  ),
}));

jest.mock("@/components/qr/DecorationPanel/CaptionEditor", () => ({
  CaptionEditor: ({
    caption,
    onChange,
  }: {
    caption: CaptionConfig;
    onChange: (caption: CaptionConfig) => void;
  }) => (
    <div data-testid="caption-editor" data-caption-text={caption.text} data-caption-fontsize={caption.fontSize}>
      <button
        data-testid="set-caption"
        onClick={() => onChange({ text: "テストキャプション", fontSize: 16 })}
      >
        set caption
      </button>
      <button
        data-testid="clear-caption"
        onClick={() => onChange({ text: "", fontSize: 14 })}
      >
        clear caption
      </button>
    </div>
  ),
}));

jest.mock("@/components/qr/DecorationPanel/LogoUploader", () => ({
  LogoUploader: ({ logo, onChange }: { logo: LogoConfig | null; onChange: (logo: LogoConfig | null) => void }) => (
    <div data-testid="logo-uploader" data-logo={logo ? JSON.stringify(logo) : "null"}>
      <button
        data-testid="logo-upload-btn"
        onClick={() =>
          onChange({
            dataUrl: "data:image/png;base64,newlogo",
            fileName: "new.png",
            fileType: "image/png",
            fileSizeKb: 15,
            sizePercent: 20,
          } as LogoConfig)
        }
      >
        upload logo
      </button>
      <button
        data-testid="logo-remove-btn"
        onClick={() => onChange(null)}
      >
        remove logo
      </button>
    </div>
  ),
}));

describe("QrGenerator", () => {
  describe("正常系: レンダリング", () => {
    it("ステップ1のセクションが表示されること", () => {
      render(<QrGenerator />);
      expect(
        screen.getByRole("region", { name: "ステップ1: URL入力" })
      ).toBeInTheDocument();
    });

    it("ステップ2のセクションが表示されること", () => {
      render(<QrGenerator />);
      expect(
        screen.getByRole("region", { name: "ステップ2: UTMパラメータ設定" })
      ).toBeInTheDocument();
    });

    it("ステップ3のセクションが表示されること", () => {
      render(<QrGenerator />);
      expect(
        screen.getByRole("region", { name: "ステップ3: 装飾設定" })
      ).toBeInTheDocument();
    });

    it("ステップ4のセクションが表示されること", () => {
      render(<QrGenerator />);
      expect(
        screen.getByRole("region", { name: "ステップ4: ダウンロード" })
      ).toBeInTheDocument();
    });

    it("UrlInputが表示されること", () => {
      render(<QrGenerator />);
      expect(screen.getByTestId("url-input")).toBeInTheDocument();
    });

    it("UtmBuilderが表示されること", () => {
      render(<QrGenerator />);
      expect(screen.getByTestId("utm-builder")).toBeInTheDocument();
    });

    it("UrlPreviewが表示されること", () => {
      render(<QrGenerator />);
      expect(screen.getByTestId("url-preview")).toBeInTheDocument();
    });

    it("QrPreviewが表示されること", () => {
      render(<QrGenerator />);
      expect(screen.getByTestId("qr-preview")).toBeInTheDocument();
    });

    it("ProgressBarが表示されること", () => {
      render(<QrGenerator />);
      expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    });
  });

  describe("状態管理", () => {
    it("URL入力時にUrlPreviewのurl propが更新されること", () => {
      render(<QrGenerator />);
      const urlField = screen.getByTestId("url-field");
      fireEvent.change(urlField, {
        target: { value: "https://example.com" },
      });
      expect(screen.getByTestId("url-preview")).toHaveTextContent(
        "https://example.com"
      );
    });

    it("validate-btnクリック後にProgressBarのcurrentが67になること（URL+UTMデフォルト）", () => {
      // URL有効(+33%) + utm.medium="qr"デフォルト(+33%) = 67%
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("validate-btn"));
      expect(screen.getByTestId("progress-bar")).toHaveAttribute(
        "data-current",
        "67"
      );
    });

    it("set-utmクリック後にProgressBarのcurrentが更新されること", () => {
      render(<QrGenerator />);
      // UTMを設定するとURLが無効でも+25%
      fireEvent.click(screen.getByTestId("set-utm"));
      const progressBar = screen.getByTestId("progress-bar");
      const current = Number(progressBar.getAttribute("data-current"));
      expect(current).toBeGreaterThan(0);
    });

    it("URL有効かつUTM設定後にProgressBarのcurrentが67になること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("validate-btn"));
      fireEvent.click(screen.getByTestId("set-utm"));
      expect(screen.getByTestId("progress-bar")).toHaveAttribute(
        "data-current",
        "67"
      );
    });
  });

  describe("プログレスメッセージ", () => {
    it("初期状態（utm.medium=qrデフォルト値あり）で「UTMパラメータを設定するとマーケティング効果UP！」が表示されること", () => {
      // INITIAL_QR_STATEのutm.medium="qr"によりhasUtm=true、completionPercent=33
      render(<QrGenerator />);
      expect(
        screen.getByTestId("progress-bar")
      ).toHaveTextContent("UTMパラメータを設定するとマーケティング効果UP！");
    });

    it("URL有効後に「QRコードが完成しました！」が表示されること", () => {
      // URL有効(+33%) + UTMデフォルト(+33%) = 67% → 完成メッセージ
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("validate-btn"));
      expect(
        screen.getByTestId("progress-bar")
      ).toHaveTextContent("QRコードが完成しました！");
    });
  });

  describe("プレースホルダー", () => {
    it("ステップ3に装飾設定コンポーネントが表示されること", () => {
      render(<QrGenerator />);
      expect(
        screen.getByRole("region", { name: "ステップ3: 装飾設定" })
      ).toBeInTheDocument();
    });

    it("ステップ4にDownloadPanelが表示されること", () => {
      render(<QrGenerator />);
      expect(screen.getByTestId("download-panel")).toBeInTheDocument();
    });

    it("URL無効のときDownloadPanelがdisabledであること", () => {
      render(<QrGenerator />);
      expect(screen.getByTestId("download-panel")).toHaveAttribute(
        "data-disabled",
        "true"
      );
    });

    it("URL有効のときDownloadPanelがdisabledでないこと", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("validate-btn"));
      expect(screen.getByTestId("download-panel")).toHaveAttribute(
        "data-disabled",
        "false"
      );
    });
  });

  describe("LogoUploader 接続 — logo state 管理", () => {
    it("初期状態: LogoUploaderに logo=null が渡ること", () => {
      render(<QrGenerator />);
      const logoUploader = screen.getByTestId("logo-uploader");
      expect(logoUploader).toHaveAttribute("data-logo", "null");
    });

    it("LogoUploader で画像を選択すると state.decoration.logo が LogoConfig 型で更新されること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("logo-upload-btn"));
      const logoUploader = screen.getByTestId("logo-uploader");
      const logoJson = logoUploader.getAttribute("data-logo");
      expect(logoJson).not.toBe("null");
      const logo = JSON.parse(logoJson!);
      expect(logo).toMatchObject({
        dataUrl: expect.stringMatching(/^data:/),
        fileName: expect.any(String),
        fileType: expect.any(String),
        fileSizeKb: expect.any(Number),
        sizePercent: expect.any(Number),
      });
    });

    it("LogoUploader で「ロゴを削除」すると state.decoration.logo が null になること", () => {
      render(<QrGenerator />);
      // まずアップロード
      fireEvent.click(screen.getByTestId("logo-upload-btn"));
      // 次に削除
      fireEvent.click(screen.getByTestId("logo-remove-btn"));
      const logoUploader = screen.getByTestId("logo-uploader");
      expect(logoUploader).toHaveAttribute("data-logo", "null");
    });

    it("選択後の logo が QrPreview の logo prop に渡ること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("logo-upload-btn"));
      const qrPreview = screen.getByTestId("qr-preview");
      const logoJson = qrPreview.getAttribute("data-logo");
      expect(logoJson).not.toBe("null");
      const logo = JSON.parse(logoJson!);
      expect(logo.dataUrl).toBe("data:image/png;base64,newlogo");
      expect(logo.sizePercent).toBe(20);
    });

    it("ロゴ選択後の logo.dataUrl が正しい値で QrPreview に渡ること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("logo-upload-btn"));
      const qrPreview = screen.getByTestId("qr-preview");
      const logo = JSON.parse(qrPreview.getAttribute("data-logo")!);
      expect(logo.dataUrl).toBe("data:image/png;base64,newlogo");
    });

    it("ロゴ選択後の logo.sizePercent が正しい値で QrPreview に渡ること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("logo-upload-btn"));
      const qrPreview = screen.getByTestId("qr-preview");
      const logo = JSON.parse(qrPreview.getAttribute("data-logo")!);
      expect(logo.sizePercent).toBe(20);
    });

    it("ロゴなし時に decorationCount が logo 分だけカウントされないこと（+0）", () => {
      render(<QrGenerator />);
      // 初期状態: logo=null
      const downloadPanel = screen.getByTestId("download-panel");
      // 初期状態は色もデフォルト、frameもnull、captionも空 → decorationCount=0
      expect(downloadPanel).toHaveAttribute("data-decoration-count", "0");
    });

    it("ロゴ設定後に decorationCount が +1 されること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("logo-upload-btn"));
      const downloadPanel = screen.getByTestId("download-panel");
      // logo=非null → decorationCount >= 1
      const count = Number(downloadPanel.getAttribute("data-decoration-count"));
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it("ロゴ削除後に decorationCount が元に戻ること", () => {
      render(<QrGenerator />);
      // アップロード → 削除
      fireEvent.click(screen.getByTestId("logo-upload-btn"));
      fireEvent.click(screen.getByTestId("logo-remove-btn"));
      const downloadPanel = screen.getByTestId("download-panel");
      expect(downloadPanel).toHaveAttribute("data-decoration-count", "0");
    });
  });

  describe("CaptionEditor 接続 — caption state 管理", () => {
    it("CaptionEditorがステップ3に表示されること", () => {
      render(<QrGenerator />);
      expect(screen.getByTestId("caption-editor")).toBeInTheDocument();
    });

    it("初期状態: CaptionEditorに caption.text='' が渡ること", () => {
      render(<QrGenerator />);
      const captionEditor = screen.getByTestId("caption-editor");
      expect(captionEditor).toHaveAttribute("data-caption-text", "");
    });

    it("初期状態: CaptionEditorに caption.fontSize=14 が渡ること", () => {
      render(<QrGenerator />);
      const captionEditor = screen.getByTestId("caption-editor");
      expect(captionEditor).toHaveAttribute("data-caption-fontsize", "14");
    });

    it("キャプション設定後に caption.text が更新されること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("set-caption"));
      const captionEditor = screen.getByTestId("caption-editor");
      expect(captionEditor).toHaveAttribute("data-caption-text", "テストキャプション");
    });

    it("キャプション設定後に caption.fontSize が更新されること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("set-caption"));
      const captionEditor = screen.getByTestId("caption-editor");
      expect(captionEditor).toHaveAttribute("data-caption-fontsize", "16");
    });

    it("キャプションクリア後に caption.text が空に戻ること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("set-caption"));
      fireEvent.click(screen.getByTestId("clear-caption"));
      const captionEditor = screen.getByTestId("caption-editor");
      expect(captionEditor).toHaveAttribute("data-caption-text", "");
    });

    it("キャプション設定後に decorationCount が +1 されること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("set-caption"));
      const downloadPanel = screen.getByTestId("download-panel");
      const count = Number(downloadPanel.getAttribute("data-decoration-count"));
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it("キャプションクリア後に decorationCount が元に戻ること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("set-caption"));
      fireEvent.click(screen.getByTestId("clear-caption"));
      const downloadPanel = screen.getByTestId("download-panel");
      expect(downloadPanel).toHaveAttribute("data-decoration-count", "0");
    });
  });

  describe("UTM ON/OFF 切り替え", () => {
    it("初期状態で UtmBuilder の enabled が true であること", () => {
      render(<QrGenerator />);
      expect(screen.getByTestId("utm-builder")).toHaveAttribute(
        "data-enabled",
        "true"
      );
    });

    it("UtmBuilder のトグルOFFで utm-builder の data-enabled が false になること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("toggle-utm-off"));
      expect(screen.getByTestId("utm-builder")).toHaveAttribute(
        "data-enabled",
        "false"
      );
    });

    it("UtmBuilder のトグルOFFで QrPreview に渡される url から utm_* が消えること", () => {
      render(<QrGenerator />);
      // まず URL を入力してバリデーション通過
      fireEvent.change(screen.getByTestId("url-field"), {
        target: { value: "https://example.com" },
      });
      fireEvent.click(screen.getByTestId("validate-btn"));
      // UTM を設定
      fireEvent.click(screen.getByTestId("set-utm"));
      // この時点で QrPreview の url に utm_source が含まれる
      expect(screen.getByTestId("qr-preview")).toHaveTextContent("utm_source");

      // UTM を OFF にする
      fireEvent.click(screen.getByTestId("toggle-utm-off"));
      // utm_source が消えること
      expect(screen.getByTestId("qr-preview")).not.toHaveTextContent("utm_source");
    });

    it("UrlPreview に utmEnabled が正しく渡されること（初期値: true）", () => {
      render(<QrGenerator />);
      expect(screen.getByTestId("url-preview")).toHaveAttribute(
        "data-utm-enabled",
        "true"
      );
    });

    it("トグルOFFで UrlPreview の utmEnabled が false になること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("toggle-utm-off"));
      expect(screen.getByTestId("url-preview")).toHaveAttribute(
        "data-utm-enabled",
        "false"
      );
    });

    it("utmEnabled=false（UTM未入力）でも getCompletionPercent の UTMステップが加算されること", () => {
      render(<QrGenerator />);
      // URL を有効にする
      fireEvent.click(screen.getByTestId("validate-btn"));
      // UTM を OFF にする（UTM未入力 + utmEnabled=false）
      fireEvent.click(screen.getByTestId("toggle-utm-off"));
      // isUrlValid(+1) + utmEnabled=false(+1) = 2/3 = 67%
      expect(screen.getByTestId("progress-bar")).toHaveAttribute(
        "data-current",
        "67"
      );
    });

    it("utmEnabled=true に戻した後、QrPreview の url に utm が復元されること", () => {
      render(<QrGenerator />);
      fireEvent.change(screen.getByTestId("url-field"), {
        target: { value: "https://example.com" },
      });
      fireEvent.click(screen.getByTestId("validate-btn"));
      fireEvent.click(screen.getByTestId("set-utm"));
      // UTM OFF
      fireEvent.click(screen.getByTestId("toggle-utm-off"));
      expect(screen.getByTestId("qr-preview")).not.toHaveTextContent("utm_source");
      // UTM ON に戻す
      fireEvent.click(screen.getByTestId("toggle-utm-on"));
      expect(screen.getByTestId("qr-preview")).toHaveTextContent("utm_source");
    });
  });

  describe("PresetSelector 接続 — プリセット一括適用", () => {
    it("PresetSelectorがステップ3に表示されること", () => {
      render(<QrGenerator />);
      expect(screen.getByTestId("preset-selector")).toBeInTheDocument();
    });

    it("初期状態: currentPresetIdが'none'であること", () => {
      render(<QrGenerator />);
      const presetSelector = screen.getByTestId("preset-selector");
      expect(presetSelector).toHaveAttribute("data-current-preset", "none");
    });

    it("ビジネスプリセット適用後にcurrentPresetIdが'business'になること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("apply-preset-business"));
      const presetSelector = screen.getByTestId("preset-selector");
      expect(presetSelector).toHaveAttribute("data-current-preset", "business");
    });

    it("ビジネスプリセット適用後にキャプションが更新されること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("apply-preset-business"));
      const captionEditor = screen.getByTestId("caption-editor");
      expect(captionEditor).toHaveAttribute("data-caption-text", "詳しくはこちら");
      expect(captionEditor).toHaveAttribute("data-caption-fontsize", "12");
    });

    it("シンプルプリセット適用後にキャプションが空に戻ること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("apply-preset-business"));
      fireEvent.click(screen.getByTestId("apply-preset-simple"));
      const captionEditor = screen.getByTestId("caption-editor");
      expect(captionEditor).toHaveAttribute("data-caption-text", "");
    });

    it("プリセット適用後にdecorationCountが更新されること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("apply-preset-business"));
      const downloadPanel = screen.getByTestId("download-panel");
      const count = Number(downloadPanel.getAttribute("data-decoration-count"));
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it("ビジネスプリセット適用後にfgColorが#1a365dに変わること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("apply-preset-business"));
      const colorCustomizer = screen.getByTestId("color-customizer");
      expect(colorCustomizer).toHaveAttribute("data-fg-color", "#1a365d");
    });

    it("ビジネスプリセット適用後にbgColorが#ffffffであること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("apply-preset-business"));
      const colorCustomizer = screen.getByTestId("color-customizer");
      expect(colorCustomizer).toHaveAttribute("data-bg-color", "#ffffff");
    });

    it("ビジネスプリセット適用後にframeTypeがbusinessに変わること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("apply-preset-business"));
      const frameSelector = screen.getByTestId("frame-selector");
      expect(frameSelector).toHaveAttribute("data-frame-type", "business");
    });

    it("シンプルプリセット適用後にcurrentPresetIdが'simple'になること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("apply-preset-simple"));
      const presetSelector = screen.getByTestId("preset-selector");
      expect(presetSelector).toHaveAttribute("data-current-preset", "simple");
    });

    it("business→simpleプリセット切り替えでcurrentPresetIdが更新されること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("apply-preset-business"));
      fireEvent.click(screen.getByTestId("apply-preset-simple"));
      const presetSelector = screen.getByTestId("preset-selector");
      expect(presetSelector).toHaveAttribute("data-current-preset", "simple");
    });

    it("シンプルプリセット適用後にfgColorが#000000に戻ること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("apply-preset-business"));
      fireEvent.click(screen.getByTestId("apply-preset-simple"));
      const colorCustomizer = screen.getByTestId("color-customizer");
      expect(colorCustomizer).toHaveAttribute("data-fg-color", "#000000");
    });
  });

  /**
   * initialParams（クエリ由来の初期値）の適用
   *
   * 用途別ページの CTA が /create?utm_source=poster&utm_medium=qr&preset=elegant に
   * リンクする（タスク 29r）。/create 側は QrGeneratorLoader が useSearchParams で読み取り
   * parseCreateSearchParams → QrGenerator の props `initialParams` として渡す。
   * QrGenerator は useState(() => buildInitialQrState(initialParams)) 相当で初期化する。
   * ここでは props 経由の初期化だけを検証する（useSearchParams と next/dynamic はテスト対象外）。
   */
  describe("initialParams — クエリ由来の初期値適用", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("(a) initialParams の utmSource 'poster' が UtmBuilder の values.source に初期反映されること", () => {
      // 意図: ポスター用途ページから遷移した時点で utm_source が入力済みになっていること。
      //       初期描画時点で反映されることが重要（ユーザー操作なしで確認）。
      render(
        <QrGenerator
          initialParams={{ preset: "elegant", utmSource: "poster", utmMedium: "qr" }}
        />
      );
      expect(screen.getByTestId("utm-builder")).toHaveAttribute("data-source", "poster");
    });

    it("(a) initialParams の utmMedium 'qr' が UtmBuilder の values.medium に初期反映されること", () => {
      // 意図: medium も同時に渡した値になること（既定値と同じ 'qr' だが明示的に検証）。
      render(
        <QrGenerator
          initialParams={{ preset: "elegant", utmSource: "poster", utmMedium: "qr" }}
        />
      );
      expect(screen.getByTestId("utm-builder")).toHaveAttribute("data-medium", "qr");
    });

    it("(a) initialParams に utmSource があると UtmBuilder の enabled が true であること", () => {
      // 意図: source を初期設定しても utmEnabled が false だと URL に反映されない。ON であることを保証。
      render(
        <QrGenerator
          initialParams={{ preset: "elegant", utmSource: "poster", utmMedium: "qr" }}
        />
      );
      expect(screen.getByTestId("utm-builder")).toHaveAttribute("data-enabled", "true");
    });

    it("(a) initialParams の preset 'elegant' が PresetSelector の currentPresetId に初期反映されること", () => {
      // 意図: プリセット選択 UI 上で「エレガント」が選択中として表示されること。
      render(
        <QrGenerator
          initialParams={{ preset: "elegant", utmSource: "poster", utmMedium: "qr" }}
        />
      );
      expect(screen.getByTestId("preset-selector")).toHaveAttribute(
        "data-current-preset",
        "elegant"
      );
    });

    it("(a) initialParams の preset 'elegant' で ColorCustomizer / FrameSelector / CaptionEditor にプリセット値が渡ること", () => {
      // 意図: PresetSelector で手動適用したときと同じく、色・フレーム・キャプションが一括で初期化されること。
      //       値は DECORATION_PRESETS の elegant と一致する（fg #44337a / bg #faf5ff / frame elegant / 'QRコードを読み取る' 12px）。
      render(<QrGenerator initialParams={{ preset: "elegant" }} />);
      expect(screen.getByTestId("color-customizer")).toHaveAttribute("data-fg-color", "#44337a");
      expect(screen.getByTestId("color-customizer")).toHaveAttribute("data-bg-color", "#faf5ff");
      expect(screen.getByTestId("frame-selector")).toHaveAttribute("data-frame-type", "elegant");
      expect(screen.getByTestId("frame-selector")).toHaveAttribute("data-frame-color", "#44337a");
      expect(screen.getByTestId("caption-editor")).toHaveAttribute("data-caption-text", "QRコードを読み取る");
      expect(screen.getByTestId("caption-editor")).toHaveAttribute("data-caption-fontsize", "12");
    });

    it("(a) initialParams の preset 適用により初期状態でも decorationCount が 1 以上になること", () => {
      // 意図: プリセット初期適用が getCompletionPercent / decorationCount の算出に反映されること。
      render(<QrGenerator initialParams={{ preset: "elegant" }} />);
      const count = Number(
        screen.getByTestId("download-panel").getAttribute("data-decoration-count")
      );
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it("(b) initialParams なしでは UtmBuilder の values.source が空であること", () => {
      // 意図: クエリなしで /create を開いた場合の後方互換（従来の初期状態）。
      render(<QrGenerator />);
      expect(screen.getByTestId("utm-builder")).toHaveAttribute("data-source", "");
    });

    it("(b) initialParams なしでは PresetSelector の currentPresetId が未選択（'none'）であること", () => {
      // 意図: 既存モックは currentPresetId が null のとき 'none' を出す。
      //       既存テスト「初期状態: currentPresetIdが'none'であること」との互換を保つため同じ表現で検証する。
      render(<QrGenerator />);
      expect(screen.getByTestId("preset-selector")).toHaveAttribute(
        "data-current-preset",
        "none"
      );
    });

    it("(b) 空の initialParams ({}) でも initialParams なしと同じ初期状態であること", () => {
      // 意図: parseCreateSearchParams が空オブジェクトを返す経路（無関係なクエリのみ）でも既定値になること。
      render(<QrGenerator initialParams={{}} />);
      expect(screen.getByTestId("utm-builder")).toHaveAttribute("data-source", "");
      expect(screen.getByTestId("utm-builder")).toHaveAttribute("data-medium", "qr");
      expect(screen.getByTestId("preset-selector")).toHaveAttribute("data-current-preset", "none");
    });

    it("(c) initialParams で preset を初期適用しても trackPresetSelected が呼ばれないこと", () => {
      // 意図: URL 由来の自動適用は「ユーザーがプリセットを選んだ」行動ではないため、
      //       GA の preset_selected イベントに混入させない（計測値の汚染防止）。
      render(<QrGenerator initialParams={{ preset: "elegant" }} />);
      expect(trackPresetSelected).not.toHaveBeenCalled();
    });

    it("(c) initialParams で utmSource を初期適用しても trackUtmSet が呼ばれないこと", () => {
      // 意図: 同様に utm_source_set / utm_medium_set イベントを自動適用で送らない。
      render(
        <QrGenerator initialParams={{ preset: "elegant", utmSource: "poster", utmMedium: "qr" }} />
      );
      expect(trackUtmSet).not.toHaveBeenCalled();
    });

    it("initialParams で初期化した後も、ユーザー操作によるプリセット変更が従来どおり動作すること", () => {
      // 意図: 初期値の適用が useState の初期化のみで完結し、以後の setState を妨げないこと。
      render(<QrGenerator initialParams={{ preset: "elegant" }} />);
      fireEvent.click(screen.getByTestId("apply-preset-business"));
      expect(screen.getByTestId("preset-selector")).toHaveAttribute(
        "data-current-preset",
        "business"
      );
      expect(screen.getByTestId("color-customizer")).toHaveAttribute("data-fg-color", "#1a365d");
    });

    it("initialParams で初期化した後も、UTM の OFF 切り替えが従来どおり動作すること", () => {
      // 意図: utmEnabled=true で初期化しても、ユーザーが OFF にできること。
      render(<QrGenerator initialParams={{ utmSource: "poster" }} />);
      fireEvent.click(screen.getByTestId("toggle-utm-off"));
      expect(screen.getByTestId("utm-builder")).toHaveAttribute("data-enabled", "false");
    });
  });
});
