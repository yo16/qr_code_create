import { drawLogoOnCanvas } from "@/lib/qr/drawLogo";
import type { LogoConfig } from "@/types/qr";

// --- Image モック ---
// Jest の jsdom 環境には HTMLImageElement があるが、src セット時の自動ロードはない。
// global.Image を差し替えて onload / onerror を手動トリガーできるようにする。

type ImageMockCallback = (() => void) | null;

interface ImageMockInstance {
  onload: ImageMockCallback;
  onerror: ImageMockCallback;
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  _triggerLoad: () => void;
  _triggerError: () => void;
}

let lastImageInstance: ImageMockInstance | null = null;

function createImageMock(naturalWidth = 100, naturalHeight = 100) {
  return class MockImage implements ImageMockInstance {
    onload: ImageMockCallback = null;
    onerror: ImageMockCallback = null;
    naturalWidth = naturalWidth;
    naturalHeight = naturalHeight;
    private _src = "";

    get src() {
      return this._src;
    }
    set src(value: string) {
      this._src = value;
      // src セット後に外部から _triggerLoad / _triggerError を呼べるよう
      // インスタンスを保持する
    }

    _triggerLoad() {
      if (this.onload) this.onload();
    }
    _triggerError() {
      if (this.onerror) (this.onerror as () => void)();
    }

    constructor() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      lastImageInstance = this;
    }
  };
}

// --- Canvas コンテキストモック ---

function createCtxMock() {
  return {
    fillStyle: "",
    fillRect: jest.fn(),
    drawImage: jest.fn(),
    clearRect: jest.fn(),
    getContext: jest.fn(),
  };
}

function createCanvasMock(size: number, ctx: ReturnType<typeof createCtxMock>) {
  return {
    width: size,
    height: size,
    getContext: jest.fn(() => ctx),
  } as unknown as HTMLCanvasElement;
}

// --- テスト ---

describe("drawLogoOnCanvas", () => {
  const baseLogoConfig: LogoConfig = {
    dataUrl: "data:image/png;base64,valid",
    fileName: "logo.png",
    fileType: "image/png",
    fileSizeKb: 10,
    sizePercent: 20,
  };

  describe("ロゴサイズの計算", () => {
    it.each([
      [10, 300],
      [20, 300],
      [30, 300],
    ])(
      "sizePercent=%i, canvasSize=%i のとき logoSizePx = canvasSize * (sizePercent / 100) になること",
      async (sizePercent, canvasSize) => {
        const MockImage = createImageMock(100, 100);
        (global as unknown as Record<string, unknown>).Image = MockImage;

        const ctx = createCtxMock();
        const canvas = createCanvasMock(canvasSize, ctx);
        const logo = { ...baseLogoConfig, sizePercent };

        const promise = drawLogoOnCanvas(canvas, logo);
        // src セット → lastImageInstance._triggerLoad()
        lastImageInstance!._triggerLoad();
        await promise;

        const expectedLogoSize = canvasSize * (sizePercent / 100);
        // drawImage の第4引数 (drawWidth) が logoSize と一致する（正方形画像の場合）
        expect(ctx.drawImage).toHaveBeenCalledWith(
          expect.anything(),
          expect.any(Number),
          expect.any(Number),
          expectedLogoSize,
          expectedLogoSize
        );
      }
    );
  });

  describe("白背景矩形の描画", () => {
    it("fillStyle が '#ffffff' に設定されること", async () => {
      const MockImage = createImageMock(100, 100);
      (global as unknown as Record<string, unknown>).Image = MockImage;

      const ctx = createCtxMock();
      const canvas = createCanvasMock(300, ctx);

      const promise = drawLogoOnCanvas(canvas, baseLogoConfig);
      lastImageInstance!._triggerLoad();
      await promise;

      expect(ctx.fillStyle).toBe("#ffffff");
    });

    it("fillRect が呼ばれること", async () => {
      const MockImage = createImageMock(100, 100);
      (global as unknown as Record<string, unknown>).Image = MockImage;

      const ctx = createCtxMock();
      const canvas = createCanvasMock(300, ctx);

      const promise = drawLogoOnCanvas(canvas, baseLogoConfig);
      lastImageInstance!._triggerLoad();
      await promise;

      expect(ctx.fillRect).toHaveBeenCalledTimes(1);
    });

    it("白背景サイズ = logoSizePx + margin*2 (margin=6) になること", async () => {
      const MockImage = createImageMock(100, 100);
      (global as unknown as Record<string, unknown>).Image = MockImage;

      const canvasSize = 300;
      const sizePercent = 20;
      const margin = 6;
      const ctx = createCtxMock();
      const canvas = createCanvasMock(canvasSize, ctx);
      const logo = { ...baseLogoConfig, sizePercent };

      const promise = drawLogoOnCanvas(canvas, logo);
      lastImageInstance!._triggerLoad();
      await promise;

      const logoSizePx = canvasSize * (sizePercent / 100);
      const bgSize = logoSizePx + margin * 2;
      const centerX = canvasSize / 2;
      const centerY = canvasSize / 2;

      expect(ctx.fillRect).toHaveBeenCalledWith(
        centerX - bgSize / 2,
        centerY - bgSize / 2,
        bgSize,
        bgSize
      );
    });
  });

  describe("drawImage の中央座標", () => {
    it("正方形画像: drawImage が中央座標 (canvasSize - logoSize) / 2 で呼ばれること", async () => {
      const MockImage = createImageMock(100, 100);
      (global as unknown as Record<string, unknown>).Image = MockImage;

      const canvasSize = 300;
      const sizePercent = 20;
      const ctx = createCtxMock();
      const canvas = createCanvasMock(canvasSize, ctx);
      const logo = { ...baseLogoConfig, sizePercent };

      const promise = drawLogoOnCanvas(canvas, logo);
      lastImageInstance!._triggerLoad();
      await promise;

      const logoSize = canvasSize * (sizePercent / 100);
      const expectedX = canvasSize / 2 - logoSize / 2;
      const expectedY = canvasSize / 2 - logoSize / 2;

      expect(ctx.drawImage).toHaveBeenCalledWith(
        expect.anything(),
        expectedX,
        expectedY,
        logoSize,
        logoSize
      );
    });
  });

  describe("Image onerror — 読み込み失敗時", () => {
    it("onerror が発火した場合に Promise が resolve されること（例外なし）", async () => {
      const MockImage = createImageMock(100, 100);
      (global as unknown as Record<string, unknown>).Image = MockImage;

      const ctx = createCtxMock();
      const canvas = createCanvasMock(300, ctx);

      const promise = drawLogoOnCanvas(canvas, baseLogoConfig);
      lastImageInstance!._triggerError();

      // reject ではなく resolve されること
      await expect(promise).resolves.toBeUndefined();
    });

    it("onerror 発火後は drawImage が呼ばれないこと（描画スキップ）", async () => {
      const MockImage = createImageMock(100, 100);
      (global as unknown as Record<string, unknown>).Image = MockImage;

      const ctx = createCtxMock();
      const canvas = createCanvasMock(300, ctx);

      const promise = drawLogoOnCanvas(canvas, baseLogoConfig);
      lastImageInstance!._triggerError();
      await promise;

      expect(ctx.drawImage).not.toHaveBeenCalled();
    });
  });

  describe("非正方形画像のアスペクト比維持", () => {
    it("横長画像 (200x100): drawWidth=logoSize, drawHeight=logoSize/2 になること", async () => {
      const MockImage = createImageMock(200, 100); // 横2:縦1
      (global as unknown as Record<string, unknown>).Image = MockImage;

      const canvasSize = 300;
      const sizePercent = 20;
      const ctx = createCtxMock();
      const canvas = createCanvasMock(canvasSize, ctx);
      const logo = { ...baseLogoConfig, sizePercent };

      const promise = drawLogoOnCanvas(canvas, logo);
      lastImageInstance!._triggerLoad();
      await promise;

      const logoSize = canvasSize * (sizePercent / 100); // 60
      // scale = min(60/200, 60/100) = min(0.3, 0.6) = 0.3
      const scale = Math.min(logoSize / 200, logoSize / 100);
      const expectedDrawWidth = 200 * scale;
      const expectedDrawHeight = 100 * scale;

      expect(ctx.drawImage).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number),
        expect.any(Number),
        expectedDrawWidth,
        expectedDrawHeight
      );
    });

    it("縦長画像 (100x200): drawWidth=logoSize/2, drawHeight=logoSize になること", async () => {
      const MockImage = createImageMock(100, 200); // 縦2:横1
      (global as unknown as Record<string, unknown>).Image = MockImage;

      const canvasSize = 300;
      const sizePercent = 20;
      const ctx = createCtxMock();
      const canvas = createCanvasMock(canvasSize, ctx);
      const logo = { ...baseLogoConfig, sizePercent };

      const promise = drawLogoOnCanvas(canvas, logo);
      lastImageInstance!._triggerLoad();
      await promise;

      const logoSize = canvasSize * (sizePercent / 100); // 60
      // scale = min(60/100, 60/200) = min(0.6, 0.3) = 0.3
      const scale = Math.min(logoSize / 100, logoSize / 200);
      const expectedDrawWidth = 100 * scale;
      const expectedDrawHeight = 200 * scale;

      expect(ctx.drawImage).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number),
        expect.any(Number),
        expectedDrawWidth,
        expectedDrawHeight
      );
    });
  });

  describe("不正 dataUrl — 関数が例外をスローしないこと", () => {
    it("dataUrl が空文字でも例外をスローしないこと", async () => {
      const MockImage = createImageMock(100, 100);
      (global as unknown as Record<string, unknown>).Image = MockImage;

      const ctx = createCtxMock();
      const canvas = createCanvasMock(300, ctx);
      const logo = { ...baseLogoConfig, dataUrl: "" };

      const promise = drawLogoOnCanvas(canvas, logo);
      // 不正 URL なので onerror を発火させる
      lastImageInstance!._triggerError();

      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe("ctx が取得できない場合", () => {
    it("getContext が null を返した場合でも例外をスローしないこと", async () => {
      const MockImage = createImageMock(100, 100);
      (global as unknown as Record<string, unknown>).Image = MockImage;

      const canvas = {
        width: 300,
        height: 300,
        getContext: jest.fn(() => null),
      } as unknown as HTMLCanvasElement;

      // ctx が null のため即 return される。Image の src は設定されない。
      await expect(drawLogoOnCanvas(canvas, baseLogoConfig)).resolves.toBeUndefined();
    });
  });
});
