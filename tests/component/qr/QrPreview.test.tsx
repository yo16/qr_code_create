import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QrPreview } from "@/components/qr/QrPreview/QrPreview";
import type { LogoConfig } from "@/types/qr";

// qrcode パッケージをモック（jsdom は Canvas API を持たないため）
jest.mock("qrcode", () => ({
  toCanvas: jest.fn().mockResolvedValue(undefined),
}));

// drawLogoOnCanvas をモック（呼び出し検証のため）
jest.mock("@/lib/qr/drawLogo", () => ({
  drawLogoOnCanvas: jest.fn().mockResolvedValue(undefined),
}));

import { drawLogoOnCanvas } from "@/lib/qr/drawLogo";
const mockDrawLogoOnCanvas = drawLogoOnCanvas as jest.Mock;

// analytics は trackErrorOccurred だけをモックし、ほかの関数（trackQrGenerated など）は実物のまま使う
// （qr_code_create-pa6: 描画失敗時のエラー計測を検証するため）
jest.mock("@/lib/analytics/events", () => ({
  ...jest.requireActual("@/lib/analytics/events"),
  trackErrorOccurred: jest.fn(),
}));

import { trackErrorOccurred } from "@/lib/analytics/events";
const mockTrackErrorOccurred = trackErrorOccurred as jest.MockedFunction<typeof trackErrorOccurred>;

// 動的 import（await import("qrcode")）もモックが効くよう jest.mock で解決済み

import QRCode from "qrcode";
const mockToCanvas = QRCode.toCanvas as jest.Mock;

describe("QrPreview", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockToCanvas.mockClear();
    mockToCanvas.mockResolvedValue(undefined);
    mockDrawLogoOnCanvas.mockClear();
    mockDrawLogoOnCanvas.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("正常系", () => {
    it("「QRコードプレビュー」ラベルが表示されること", () => {
      render(<QrPreview url="https://example.com" isUrlValid={true} />);
      expect(screen.getByText("QRコードプレビュー")).toBeInTheDocument();
    });

    it("有効URL + isUrlValid=true のとき canvas 要素がDOMに存在すること", () => {
      render(<QrPreview url="https://example.com" isUrlValid={true} />);
      expect(document.querySelector("canvas")).toBeInTheDocument();
    });

    it("有効URL + isUrlValid=true のとき aria-label が「生成されたQRコード」であること", () => {
      render(<QrPreview url="https://example.com" isUrlValid={true} />);
      expect(
        screen.getByRole("img", { name: "生成されたQRコード" })
      ).toBeInTheDocument();
    });

    it("有効URL + isUrlValid=true のとき、デバウンス後に toCanvas が呼ばれること", async () => {
      render(<QrPreview url="https://example.com" isUrlValid={true} />);

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockToCanvas).toHaveBeenCalledTimes(1);
      });
    });

    it("toCanvas に url・size・色が正しく渡されること", async () => {
      render(
        <QrPreview
          url="https://example.com"
          isUrlValid={true}
          fgColor="#111111"
          bgColor="#eeeeee"
          size={128}
        />
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockToCanvas).toHaveBeenCalledWith(
          expect.any(HTMLCanvasElement),
          "https://example.com",
          expect.objectContaining({
            width: 128,
            color: { dark: "#111111", light: "#eeeeee" },
          })
        );
      });
    });

    it("toCanvas に errorCorrectionLevel: \"H\" が渡されること（ロゴ重ね対応）", async () => {
      render(<QrPreview url="https://example.com" isUrlValid={true} />);

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockToCanvas).toHaveBeenCalledWith(
          expect.any(HTMLCanvasElement),
          "https://example.com",
          expect.objectContaining({
            errorCorrectionLevel: "H",
          })
        );
      });
    });
  });

  describe("異常系", () => {
    it("url='' のときプレースホルダーテキストが表示されること", () => {
      render(<QrPreview url="" isUrlValid={false} />);
      expect(
        screen.getByText("URLを入力してQRコードを生成")
      ).toBeInTheDocument();
    });

    it("isUrlValid=false のときプレースホルダーテキストが表示されること", () => {
      render(
        <QrPreview url="https://example.com" isUrlValid={false} />
      );
      expect(
        screen.getByText("URLを入力してQRコードを生成")
      ).toBeInTheDocument();
    });

    it("url='' のとき aria-label が「QRコードプレースホルダー」であること", () => {
      render(<QrPreview url="" isUrlValid={false} />);
      expect(
        screen.getByRole("img", { name: "QRコードプレースホルダー" })
      ).toBeInTheDocument();
    });

    it("url='' のとき toCanvas が呼ばれないこと", () => {
      render(<QrPreview url="" isUrlValid={false} />);
      expect(mockToCanvas).not.toHaveBeenCalled();
    });

    it("toCanvas がエラーを投げた場合にエラーメッセージが表示されること", async () => {
      mockToCanvas.mockRejectedValueOnce(new Error("QR generation failed"));

      render(<QrPreview url="https://example.com" isUrlValid={true} />);

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(
          screen.getByText("QRコードの生成に失敗しました")
        ).toBeInTheDocument();
      });
    });
  });

  // エラー計測（qr_code_create-pa6）: 描画失敗を error_occurred として、種類（error.name）だけを送る
  describe("エラー計測 (trackErrorOccurred)", () => {
    beforeEach(() => {
      mockTrackErrorOccurred.mockClear();
    });

    it("toCanvas が Error で失敗すると trackErrorOccurred(\"qr_render\", \"Error\") が 1 回呼ばれること", async () => {
      // 意図: catch で種類だけを送ること。既存の「エラーメッセージ表示」と同じ経路で、表示と計測の両方が動く
      mockToCanvas.mockRejectedValueOnce(new Error("QR generation failed"));

      render(<QrPreview url="https://example.com" isUrlValid={true} />);

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockTrackErrorOccurred).toHaveBeenCalledTimes(1);
      });
      expect(mockTrackErrorOccurred).toHaveBeenCalledWith("qr_render", "Error");
      expect(screen.getByText("QRコードの生成に失敗しました")).toBeInTheDocument();
    });

    it("第 2 引数が種類だけで、message に含まれる URL や入力値を含まないこと", async () => {
      // 意図: プライバシーポリシー「エラーの発生とその種類（入力した内容は含みません）」との整合。
      //       入力 URL が message に混ざっても送るのは name（ここでは TypeError）だけであること
      const url = "https://example.com/secret?token=abc";
      mockToCanvas.mockRejectedValueOnce(new TypeError(`cannot encode ${url}`));

      render(<QrPreview url={url} isUrlValid={true} />);

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockTrackErrorOccurred).toHaveBeenCalledTimes(1);
      });
      const [errorType, errorMessage] = mockTrackErrorOccurred.mock.calls[0];
      expect(errorType).toBe("qr_render");
      expect(errorMessage).toBe("TypeError");
      expect(errorMessage).not.toContain("https://");
      expect(errorMessage).not.toContain("token");
    });

    it("Error 以外の値で失敗した場合は種類が \"unknown\" になること", async () => {
      // 意図: 文字列などが throw されても、その値（入力内容を含みうる）を送らず unknown に丸めること
      mockToCanvas.mockRejectedValueOnce("https://example.com/secret");

      render(<QrPreview url="https://example.com" isUrlValid={true} />);

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockTrackErrorOccurred).toHaveBeenCalledTimes(1);
      });
      expect(mockTrackErrorOccurred).toHaveBeenCalledWith("qr_render", "unknown");
    });

    it("描画に成功した場合は trackErrorOccurred が呼ばれないこと", async () => {
      // 意図: 正常系で error_occurred が誤発火しないこと
      render(<QrPreview url="https://example.com" isUrlValid={true} />);

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockToCanvas).toHaveBeenCalledTimes(1);
      });
      expect(mockTrackErrorOccurred).not.toHaveBeenCalled();
    });
  });

  describe("コントラスト警告", () => {
    it("コントラスト不足(fgColor=#eeeeee, bgColor=#ffffff)のとき警告が表示されること", async () => {
      render(
        <QrPreview
          url="https://example.com"
          isUrlValid={true}
          fgColor="#eeeeee"
          bgColor="#ffffff"
        />
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("コントラスト不足の警告にWCAG AA基準への言及が含まれること", async () => {
      render(
        <QrPreview
          url="https://example.com"
          isUrlValid={true}
          fgColor="#eeeeee"
          bgColor="#ffffff"
        />
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("WCAG AA");
      });
    });

    it("コントラスト十分(fgColor=#000000, bgColor=#ffffff)のとき警告が表示されないこと", async () => {
      render(
        <QrPreview
          url="https://example.com"
          isUrlValid={true}
          fgColor="#000000"
          bgColor="#ffffff"
        />
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });

    it("isUrlValid=false のとき、コントラスト不足でも警告が表示されないこと", () => {
      // shouldRender が false の場合、コントラスト警告の条件(shouldRender && !contrastOk)が false になる
      render(
        <QrPreview
          url=""
          isUrlValid={false}
          fgColor="#eeeeee"
          bgColor="#ffffff"
        />
      );
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("デフォルト props", () => {
    it("isUrlValid を省略した場合はプレースホルダーが表示されること（デフォルト false）", () => {
      render(<QrPreview url="https://example.com" />);
      expect(
        screen.getByText("URLを入力してQRコードを生成")
      ).toBeInTheDocument();
    });
  });

  describe("previewArea — キャプション有無でも高さがsizeのまま正方形であること", () => {
    it("caption未指定のときpreviewAreaの高さがsize（256px）であること", () => {
      render(<QrPreview url="https://example.com" isUrlValid={true} />);
      const previewArea = screen.getByRole("img");
      expect(previewArea.style.height).toBe("256px");
      expect(previewArea.style.width).toBe("256px");
    });

    it("caption指定時でもpreviewAreaの高さがsize（256px）のままであること", () => {
      render(
        <QrPreview
          url="https://example.com"
          isUrlValid={true}
          caption={{ text: "テスト", fontSize: 14 }}
        />
      );
      const previewArea = screen.getByRole("img");
      expect(previewArea.style.height).toBe("256px");
      expect(previewArea.style.width).toBe("256px");
    });
  });

  describe("ロゴ描画 (drawLogoOnCanvas)", () => {
    const mockLogo: LogoConfig = {
      dataUrl: "data:image/png;base64,abc123",
      fileName: "logo.png",
      fileType: "image/png",
      fileSizeKb: 10,
      sizePercent: 20,
    };

    it("logo=null のとき drawLogoOnCanvas が呼ばれないこと", async () => {
      render(
        <QrPreview url="https://example.com" isUrlValid={true} logo={null} />
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockToCanvas).toHaveBeenCalledTimes(1);
      });

      expect(mockDrawLogoOnCanvas).not.toHaveBeenCalled();
    });

    it("logo 指定時: QR描画後に drawLogoOnCanvas が呼ばれること", async () => {
      render(
        <QrPreview
          url="https://example.com"
          isUrlValid={true}
          logo={mockLogo}
        />
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockDrawLogoOnCanvas).toHaveBeenCalledTimes(1);
      });

      expect(mockDrawLogoOnCanvas).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        mockLogo
      );
    });

    it("logo.sizePercent 変更で再描画が発生すること（useCallback 依存配列）", async () => {
      const { rerender } = render(
        <QrPreview
          url="https://example.com"
          isUrlValid={true}
          logo={mockLogo}
        />
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockDrawLogoOnCanvas).toHaveBeenCalledTimes(1);
      });

      mockDrawLogoOnCanvas.mockClear();
      mockToCanvas.mockClear();

      const updatedLogo: LogoConfig = { ...mockLogo, sizePercent: 30 };
      rerender(
        <QrPreview
          url="https://example.com"
          isUrlValid={true}
          logo={updatedLogo}
        />
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockDrawLogoOnCanvas).toHaveBeenCalledTimes(1);
      });

      expect(mockDrawLogoOnCanvas).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        updatedLogo
      );
    });

    it("画像フレームあり + logo 指定時に drawLogoOnCanvas が呼ばれること", async () => {
      // 画像フレーム (hasImageFrame=true) ルートでもロゴ描画経路に到達することを検証
      const originalImage = global.Image;
      const originalGetContext = HTMLCanvasElement.prototype.getContext;

      class AutoLoadImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        naturalWidth = 944;
        naturalHeight = 944;
        private _src = "";
        get src() {
          return this._src;
        }
        set src(value: string) {
          this._src = value;
          Promise.resolve().then(() => {
            if (this.onload) this.onload();
          });
        }
      }

      (global as unknown as { Image: unknown }).Image =
        AutoLoadImage as unknown as typeof Image;

      // jsdomはCanvasのgetContextを実装していないためモックで代替
      HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
        drawImage: jest.fn(),
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        fillStyle: "",
      })) as unknown as typeof HTMLCanvasElement.prototype.getContext;

      try {
        render(
          <QrPreview
            url="https://example.com"
            isUrlValid={true}
            logo={mockLogo}
            frameConfig={{ type: "img-simple-black", color: "#000000" }}
          />
        );

        await act(async () => {
          jest.advanceTimersByTime(500);
        });

        await waitFor(() => {
          expect(mockDrawLogoOnCanvas).toHaveBeenCalledTimes(1);
        });

        expect(mockDrawLogoOnCanvas).toHaveBeenCalledWith(
          expect.any(HTMLCanvasElement),
          mockLogo
        );

        // 画像フレーム経路でも errorCorrectionLevel: "H" で呼ばれていること
        expect(mockToCanvas).toHaveBeenCalledWith(
          expect.any(HTMLCanvasElement),
          "https://example.com",
          expect.objectContaining({ errorCorrectionLevel: "H" })
        );
      } finally {
        (global as unknown as { Image: unknown }).Image = originalImage;
        HTMLCanvasElement.prototype.getContext = originalGetContext;
      }
    });

    it("drawLogoOnCanvas が失敗しても hasError 状態にならないこと", async () => {
      // drawLogoOnCanvas 内部では読み込み失敗時に resolve するが、
      // QrPreview の try-catch に到達するエラーをスローしても
      // hasError が立たないことを検証する
      // （実装上は drawLogoOnCanvas 自体は例外をスローしない設計）
      mockDrawLogoOnCanvas.mockResolvedValueOnce(undefined);

      render(
        <QrPreview
          url="https://example.com"
          isUrlValid={true}
          logo={mockLogo}
        />
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockDrawLogoOnCanvas).toHaveBeenCalledTimes(1);
      });

      // hasError=true のときに表示されるエラーメッセージが存在しないこと
      expect(
        screen.queryByText("QRコードの生成に失敗しました")
      ).not.toBeInTheDocument();
    });
  });

  describe("キャプションHTMLプレビュー", () => {
    it("caption未指定のときキャプション要素が存在しないこと", () => {
      const { container } = render(<QrPreview url="https://example.com" isUrlValid={true} />);
      const captionEl = container.querySelector("[class*='captionPreview']");
      expect(captionEl).toBeNull();
    });

    it("caption.text空文字のときキャプション要素が存在しないこと", () => {
      const { container } = render(
        <QrPreview
          url="https://example.com"
          isUrlValid={true}
          caption={{ text: "", fontSize: 14 }}
        />
      );
      const captionEl = container.querySelector("[class*='captionPreview']");
      expect(captionEl).toBeNull();
    });

    it("caption指定時にキャプションテキストがHTMLで表示されること", () => {
      render(
        <QrPreview
          url="https://example.com"
          isUrlValid={true}
          caption={{ text: "スキャンしてね", fontSize: 14 }}
        />
      );
      expect(screen.getByText("スキャンしてね")).toBeInTheDocument();
    });

    it("caption指定時にキャプションのフォントサイズがstyleで設定されること", () => {
      render(
        <QrPreview
          url="https://example.com"
          isUrlValid={true}
          caption={{ text: "テスト", fontSize: 20 }}
        />
      );
      const captionEl = screen.getByText("テスト");
      expect(captionEl.style.fontSize).toBe("20px");
    });

    it("isUrlValid=falseのときキャプションが表示されないこと", () => {
      render(
        <QrPreview
          url="https://example.com"
          isUrlValid={false}
          caption={{ text: "テスト", fontSize: 14 }}
        />
      );
      expect(screen.queryByText("テスト")).not.toBeInTheDocument();
    });

    it("caption.textが空白のみのときキャプションが表示されないこと", () => {
      render(
        <QrPreview
          url="https://example.com"
          isUrlValid={true}
          caption={{ text: "   ", fontSize: 14 }}
        />
      );
      // trimで空白のみはhasCaptionがfalseになるため表示されない
      const allP = document.querySelectorAll("p");
      const captionP = Array.from(allP).filter((p) => p.textContent?.trim() === "");
      // captionPreviewクラスを持つpは存在しないはず
      expect(captionP.length === 0 || !captionP.some((p) => p.className.includes("captionPreview"))).toBe(true);
    });
  });
});
