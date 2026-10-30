import { svgDataUrlToPngDataUrl, SVG_PNG_MAX_EDGE } from "@/lib/qr/svgToPng";

interface FakeImageInit {
  w: number;
  h: number;
  fail?: boolean;
}

const PNG = "data:image/png;base64,AAAA";

let created: { width: number; height: number }[];
let toDataURLImpl: () => string;
let getContextImpl: () => unknown;

function installImage(init: FakeImageInit): void {
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = init.w;
    naturalHeight = init.h;
    set src(_v: string) {
      queueMicrotask(() => {
        if (init.fail) this.onerror?.();
        else this.onload?.();
      });
    }
  }
  Object.defineProperty(global, "Image", { value: FakeImage, configurable: true, writable: true });
}

const originalImage = global.Image;
const originalCreate = document.createElement.bind(document);

beforeEach(() => {
  created = [];
  toDataURLImpl = () => PNG;
  getContextImpl = () => ({ drawImage: jest.fn() });
  jest.spyOn(document, "createElement").mockImplementation(((tag: string) => {
    if (tag !== "canvas") return originalCreate(tag);
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => getContextImpl(),
      toDataURL: () => toDataURLImpl(),
    };
    created.push(canvas);
    return canvas as unknown as HTMLCanvasElement;
  }) as typeof document.createElement);
});

afterEach(() => {
  jest.restoreAllMocks();
  Object.defineProperty(global, "Image", { value: originalImage, configurable: true, writable: true });
});

describe("svgDataUrlToPngDataUrl", () => {
  it("横長 SVG は比率を保ち長辺 512px になる", async () => {
    installImage({ w: 200, h: 100 });
    await expect(svgDataUrlToPngDataUrl("data:image/svg+xml;base64,AA")).resolves.toBe(PNG);
    expect(created[0]).toMatchObject({ width: SVG_PNG_MAX_EDGE, height: 256 });
  });

  it("縦長 SVG は比率を保ち長辺 512px になる", async () => {
    installImage({ w: 100, h: 400 });
    await svgDataUrlToPngDataUrl("x");
    expect(created[0]).toMatchObject({ width: 128, height: SVG_PNG_MAX_EDGE });
  });

  it("小さい SVG は拡大されて長辺 512px になる", async () => {
    installImage({ w: 10, h: 10 });
    await svgDataUrlToPngDataUrl("x");
    expect(created[0]).toMatchObject({ width: 512, height: 512 });
  });

  it("極端に細長い SVG でも短辺は 1px 以上になる", async () => {
    installImage({ w: 10000, h: 1 });
    await svgDataUrlToPngDataUrl("x");
    expect(created[0].height).toBeGreaterThanOrEqual(1);
    expect(created[0].width).toBe(512);
  });

  it("寸法の無い SVG は 512x512 になる", async () => {
    installImage({ w: 0, h: 0 });
    await svgDataUrlToPngDataUrl("x");
    expect(created[0]).toMatchObject({ width: 512, height: 512 });
  });

  it("画像の読み込みに失敗すると reject する", async () => {
    installImage({ w: 1, h: 1, fail: true });
    await expect(svgDataUrlToPngDataUrl("x")).rejects.toThrow();
  });

  it("toDataURL が例外を投げると reject する", async () => {
    installImage({ w: 1, h: 1 });
    toDataURLImpl = () => {
      throw new Error("tainted");
    };
    await expect(svgDataUrlToPngDataUrl("x")).rejects.toThrow("tainted");
  });

  it("toDataURL が PNG 以外を返すと reject する", async () => {
    installImage({ w: 1, h: 1 });
    toDataURLImpl = () => "data:,";
    await expect(svgDataUrlToPngDataUrl("x")).rejects.toThrow();
  });

  it("canvas の context が取れないと reject する", async () => {
    installImage({ w: 1, h: 1 });
    getContextImpl = () => null;
    await expect(svgDataUrlToPngDataUrl("x")).rejects.toThrow();
  });
});
