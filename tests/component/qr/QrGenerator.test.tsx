import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QrGenerator } from "@/components/qr/QrGenerator/QrGenerator";
import type { LogoConfig } from "@/types/qr";

// 子コンポーネントをモック
jest.mock("@/components/qr/UrlInput/UrlInput", () => ({
  UrlInput: ({ value, onChange, onValidationChange }: any) => (
    <div data-testid="url-input">
      <input
        data-testid="url-field"
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
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
  UtmBuilder: ({ values, onChange }: any) => (
    <div data-testid="utm-builder">
      <button
        data-testid="set-utm"
        onClick={() => onChange({ ...values, source: "flyer" })}
      >
        set utm
      </button>
    </div>
  ),
}));

jest.mock("@/components/qr/UrlPreview/UrlPreview", () => ({
  UrlPreview: (props: any) => (
    <div data-testid="url-preview">{props.url}</div>
  ),
}));

jest.mock("@/components/qr/QrPreview/QrPreview", () => ({
  QrPreview: (props: any) => (
    <div
      data-testid="qr-preview"
      data-logo={props.logo ? JSON.stringify(props.logo) : "null"}
    >
      {props.url}
    </div>
  ),
}));

jest.mock("@/components/ui/ProgressBar/ProgressBar", () => ({
  ProgressBar: ({ current, message }: any) => (
    <div data-testid="progress-bar" data-current={current}>
      {message}
    </div>
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
});
