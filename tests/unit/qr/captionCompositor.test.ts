/**
 * @jest-environment jsdom
 */
import { createCanvasWithCaption } from "@/lib/qr/captionCompositor";

describe("createCanvasWithCaption", () => {
  let mockFillText: jest.Mock;
  let mockFillRect: jest.Mock;
  let mockDrawImage: jest.Mock;
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    mockFillText = jest.fn();
    mockFillRect = jest.fn();
    mockDrawImage = jest.fn();
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
      fillText: mockFillText,
      fillRect: mockFillRect,
      drawImage: mockDrawImage,
      fillStyle: "",
      font: "",
      textAlign: "",
      textBaseline: "",
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it("caption未指定のとき元のcanvasをそのまま返すこと", () => {
    const source = document.createElement("canvas");
    source.width = 256;
    source.height = 256;
    const result = createCanvasWithCaption(source);
    expect(result).toBe(source);
  });

  it("caption.text空文字のとき元のcanvasをそのまま返すこと", () => {
    const source = document.createElement("canvas");
    source.width = 256;
    source.height = 256;
    const result = createCanvasWithCaption(source, { text: "", fontSize: 14 });
    expect(result).toBe(source);
  });

  it("caption.text空白のみのとき元のcanvasをそのまま返すこと", () => {
    const source = document.createElement("canvas");
    source.width = 256;
    source.height = 256;
    const result = createCanvasWithCaption(source, { text: "   ", fontSize: 14 });
    expect(result).toBe(source);
  });

  it("caption指定時に新しいcanvasを返すこと（元のcanvasとは別オブジェクト）", () => {
    const source = document.createElement("canvas");
    source.width = 256;
    source.height = 256;
    const result = createCanvasWithCaption(source, { text: "テスト", fontSize: 14 });
    expect(result).not.toBe(source);
  });

  it("caption指定時に新canvasの高さがソース高さ + captionHeightであること", () => {
    const source = document.createElement("canvas");
    source.width = 256;
    source.height = 256;
    const fontSize = 14;
    const padding = 8;
    const expectedHeight = 256 + fontSize + padding * 2;
    const result = createCanvasWithCaption(source, { text: "テスト", fontSize });
    expect(result.width).toBe(256);
    expect(result.height).toBe(expectedHeight);
  });

  it("caption指定時にfillTextがキャプションテキストで呼ばれること", () => {
    const source = document.createElement("canvas");
    source.width = 256;
    source.height = 256;
    createCanvasWithCaption(source, { text: "スキャンしてね", fontSize: 14 });
    expect(mockFillText).toHaveBeenCalledWith(
      "スキャンしてね",
      128,
      expect.any(Number)
    );
  });

  it("caption指定時にdrawImageでソースcanvasがコピーされること", () => {
    const source = document.createElement("canvas");
    source.width = 256;
    source.height = 256;
    createCanvasWithCaption(source, { text: "テスト", fontSize: 14 });
    expect(mockDrawImage).toHaveBeenCalledWith(source, 0, 0);
  });

  it("caption指定時に背景がfillRectで塗りつぶされること", () => {
    const source = document.createElement("canvas");
    source.width = 256;
    source.height = 256;
    createCanvasWithCaption(source, { text: "テスト", fontSize: 14 });
    expect(mockFillRect).toHaveBeenCalledWith(0, 0, 256, expect.any(Number));
  });
});
