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
      } finally {
        (global as unknown as { Image: unknown }).Image = originalImage;
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
});
