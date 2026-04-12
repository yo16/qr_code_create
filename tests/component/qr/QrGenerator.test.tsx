import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QrGenerator } from "@/components/qr/QrGenerator/QrGenerator";

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
    <div data-testid="qr-preview">{props.url}</div>
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
  DownloadPanel: ({ disabled }: any) => (
    <div data-testid="download-panel" data-disabled={disabled ? "true" : "false"} />
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

    it("validate-btnクリック後にProgressBarのcurrentが50になること（URL+UTMデフォルト）", () => {
      // URL有効(+25%) + utm.medium="qr"デフォルト(+25%) = 50%
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("validate-btn"));
      expect(screen.getByTestId("progress-bar")).toHaveAttribute(
        "data-current",
        "50"
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

    it("URL有効かつUTM設定後にProgressBarのcurrentが50になること", () => {
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("validate-btn"));
      fireEvent.click(screen.getByTestId("set-utm"));
      expect(screen.getByTestId("progress-bar")).toHaveAttribute(
        "data-current",
        "50"
      );
    });
  });

  describe("プログレスメッセージ", () => {
    it("初期状態（utm.medium=qrデフォルト値あり）で「UTMパラメータを設定するとマーケティング効果UP！」が表示されること", () => {
      // INITIAL_QR_STATEのutm.medium="qr"によりhasUtm=true、completionPercent=25
      render(<QrGenerator />);
      expect(
        screen.getByTestId("progress-bar")
      ).toHaveTextContent("UTMパラメータを設定するとマーケティング効果UP！");
    });

    it("URL有効後に「装飾でQRコードをもっと魅力的に」が表示されること", () => {
      // URL有効(+25%) + UTMデフォルト(+25%) = 50%
      render(<QrGenerator />);
      fireEvent.click(screen.getByTestId("validate-btn"));
      expect(
        screen.getByTestId("progress-bar")
      ).toHaveTextContent("装飾でQRコードをもっと魅力的に");
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
});
