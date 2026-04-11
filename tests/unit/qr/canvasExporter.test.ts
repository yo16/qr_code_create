import { canvasToPng, canvasToSvg, downloadFile } from "@/lib/qr/canvasExporter";

// Canvas モック
const mockToDataURL = jest.fn().mockReturnValue("data:image/png;base64,abc123");
const mockCanvas = {
  toDataURL: mockToDataURL,
  width: 256,
  height: 256,
} as unknown as HTMLCanvasElement;

// URL.createObjectURL / URL.revokeObjectURL のモック
const mockCreateObjectURL = jest.fn().mockReturnValue("blob:http://localhost/test-url");
const mockRevokeObjectURL = jest.fn();

beforeAll(() => {
  Object.defineProperty(globalThis, "URL", {
    value: {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    },
    writable: true,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockToDataURL.mockReturnValue("data:image/png;base64,abc123");
  mockCreateObjectURL.mockReturnValue("blob:http://localhost/test-url");
});

describe("canvasToPng", () => {
  it("canvas.toDataURL が \"image/png\" で呼ばれること", () => {
    canvasToPng(mockCanvas);
    expect(mockToDataURL).toHaveBeenCalledWith("image/png");
  });

  it("canvas.toDataURL の戻り値（data URL）が返ること", () => {
    const result = canvasToPng(mockCanvas);
    expect(result).toBe("data:image/png;base64,abc123");
  });

  it("data: で始まる文字列が返ること", () => {
    const result = canvasToPng(mockCanvas);
    expect(result).toMatch(/^data:/);
  });
});

describe("canvasToSvg", () => {
  it("SVG文字列が返ること（<svg> タグを含む）", () => {
    const result = canvasToSvg(mockCanvas);
    expect(result).toContain("<svg");
    expect(result).toContain("</svg>");
  });

  it("xmlns 属性が含まれること", () => {
    const result = canvasToSvg(mockCanvas);
    expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("width 属性が canvas の幅（256）で設定されること", () => {
    const result = canvasToSvg(mockCanvas);
    expect(result).toContain('width="256"');
  });

  it("height 属性が canvas の高さ（256）で設定されること", () => {
    const result = canvasToSvg(mockCanvas);
    expect(result).toContain('height="256"');
  });

  it("SVG 内に <image> タグが含まれること", () => {
    const result = canvasToSvg(mockCanvas);
    expect(result).toContain("<image");
  });

  it("SVG 内に canvas の data URL が href として埋め込まれること", () => {
    const result = canvasToSvg(mockCanvas);
    expect(result).toContain('href="data:image/png;base64,abc123"');
  });

  it("canvas.toDataURL が内部で呼ばれること", () => {
    canvasToSvg(mockCanvas);
    expect(mockToDataURL).toHaveBeenCalled();
  });
});

describe("downloadFile", () => {
  let mockAnchor: {
    href: string;
    download: string;
    click: jest.Mock;
  };
  let createElementSpy: jest.SpyInstance;
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;

  beforeEach(() => {
    mockAnchor = {
      href: "",
      download: "",
      click: jest.fn(),
    };

    createElementSpy = jest
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) => {
        if (tagName === "a") {
          return mockAnchor as unknown as HTMLElement;
        }
        return document.createElement(tagName);
      });

    appendChildSpy = jest
      .spyOn(document.body, "appendChild")
      .mockImplementation((node) => node as Node);

    removeChildSpy = jest
      .spyOn(document.body, "removeChild")
      .mockImplementation((node) => node as Node);
  });

  afterEach(() => {
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it("document.createElement(\"a\") が呼ばれること", () => {
    downloadFile("data:image/png;base64,abc123", "qrcode.png", "image/png");
    expect(createElementSpy).toHaveBeenCalledWith("a");
  });

  it("a.download にファイル名が設定されること", () => {
    downloadFile("data:image/png;base64,abc123", "qrcode.png", "image/png");
    expect(mockAnchor.download).toBe("qrcode.png");
  });

  it("a.href に blob URL が設定されること", () => {
    downloadFile("data:image/png;base64,abc123", "qrcode.png", "image/png");
    expect(mockAnchor.href).toBe("blob:http://localhost/test-url");
  });

  it("a.click() が呼ばれること", () => {
    downloadFile("data:image/png;base64,abc123", "qrcode.png", "image/png");
    expect(mockAnchor.click).toHaveBeenCalledTimes(1);
  });

  it("document.body.appendChild が呼ばれること", () => {
    downloadFile("data:image/png;base64,abc123", "qrcode.png", "image/png");
    expect(appendChildSpy).toHaveBeenCalled();
  });

  it("document.body.removeChild が呼ばれること", () => {
    downloadFile("data:image/png;base64,abc123", "qrcode.png", "image/png");
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it("SVG コンテンツの場合も a.click() が呼ばれること", () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><image href="data:image/png;base64,abc123"/></svg>';
    downloadFile(svgContent, "qrcode.svg", "image/svg+xml");
    expect(mockAnchor.click).toHaveBeenCalledTimes(1);
  });

  it("SVG コンテンツの場合は download が \"qrcode.svg\" になること", () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"></svg>';
    downloadFile(svgContent, "qrcode.svg", "image/svg+xml");
    expect(mockAnchor.download).toBe("qrcode.svg");
  });
});
