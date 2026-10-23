import {
  FRAME_OPTIONS,
  DEFAULT_FRAME_CONFIG,
  drawFrame,
  type FrameType,
} from "@/lib/qr/frameRenderer";

const BASIC_FRAME_TYPES: FrameType[] = [
  "none",
  "simple",
  "rounded",
  "ornate",
  "elegant",
  "pop",
  "business",
  "festive",
];

describe("FRAME_OPTIONS", () => {
  it("type が \"img-\" で始まる画像フレームが1件以上あり、それぞれ imageSrc が文字列であること", () => {
    const imageFrames = FRAME_OPTIONS.filter((o) => o.type.startsWith("img-"));
    expect(imageFrames.length).toBeGreaterThanOrEqual(1);
    for (const option of imageFrames) {
      expect(typeof option.imageSrc).toBe("string");
    }
  });

  it("全 type が基本8種または \"img-\" で始まる画像フレームのいずれかであること", () => {
    for (const option of FRAME_OPTIONS) {
      const isBasic = BASIC_FRAME_TYPES.includes(option.type);
      const isImage = option.type.startsWith("img-");
      expect(isBasic || isImage).toBe(true);
    }
  });

  it("各オプションに type / label / category があること", () => {
    for (const option of FRAME_OPTIONS) {
      expect(option).toHaveProperty("type");
      expect(option).toHaveProperty("label");
      expect(option).toHaveProperty("category");
      expect(typeof option.type).toBe("string");
      expect(typeof option.label).toBe("string");
      expect(typeof option.category).toBe("string");
    }
  });

  it("type が重複しないこと", () => {
    const types = FRAME_OPTIONS.map((o) => o.type);
    const unique = new Set(types);
    expect(unique.size).toBe(FRAME_OPTIONS.length);
  });

  it("基本8種（none / simple / rounded / ornate / elegant / pop / business / festive）がすべて含まれること", () => {
    const types = FRAME_OPTIONS.map((o) => o.type);
    for (const t of BASIC_FRAME_TYPES) {
      expect(types).toContain(t);
    }
  });
});

describe("DEFAULT_FRAME_CONFIG", () => {
  it("type が \"none\" であること", () => {
    expect(DEFAULT_FRAME_CONFIG.type).toBe("none");
  });

  it("color が \"#000000\" であること", () => {
    expect(DEFAULT_FRAME_CONFIG.color).toBe("#000000");
  });
});

// CanvasRenderingContext2D のモック生成ヘルパー
function createMockCtx(): jest.Mocked<
  Pick<
    CanvasRenderingContext2D,
    | "save"
    | "restore"
    | "strokeRect"
    | "beginPath"
    | "moveTo"
    | "lineTo"
    | "arcTo"
    | "closePath"
    | "stroke"
    | "setLineDash"
    | "fillRect"
    | "strokeStyle"
    | "lineWidth"
    | "fillStyle"
  >
> {
  return {
    save: jest.fn(),
    restore: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arcTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    setLineDash: jest.fn(),
    fillRect: jest.fn(),
    strokeStyle: "",
    lineWidth: 0,
    fillStyle: "",
  } as unknown as jest.Mocked<
    Pick<
      CanvasRenderingContext2D,
      | "save"
      | "restore"
      | "strokeRect"
      | "beginPath"
      | "moveTo"
      | "lineTo"
      | "arcTo"
      | "closePath"
      | "stroke"
      | "setLineDash"
      | "fillRect"
      | "strokeStyle"
      | "lineWidth"
      | "fillStyle"
    >
  >;
}

describe("drawFrame", () => {
  describe("type=\"none\"", () => {
    it("ctx のメソッドを一切呼ばないこと（描画しないこと）", () => {
      const ctx = createMockCtx();
      drawFrame(ctx as unknown as CanvasRenderingContext2D, { type: "none", color: "#ff0000" }, 200, 200);
      expect(ctx.save).not.toHaveBeenCalled();
      expect(ctx.strokeRect).not.toHaveBeenCalled();
      expect(ctx.stroke).not.toHaveBeenCalled();
    });

    it("strokeStyle が変更されないこと", () => {
      const ctx = createMockCtx();
      const originalStyle = ctx.strokeStyle;
      drawFrame(ctx as unknown as CanvasRenderingContext2D, { type: "none", color: "#ff0000" }, 200, 200);
      expect(ctx.strokeStyle).toBe(originalStyle);
    });
  });

  describe("type=\"simple\"", () => {
    it("ctx.save() が呼ばれること", () => {
      const ctx = createMockCtx();
      drawFrame(ctx as unknown as CanvasRenderingContext2D, { type: "simple", color: "#000000" }, 200, 200);
      expect(ctx.save).toHaveBeenCalled();
    });

    it("ctx.restore() が呼ばれること", () => {
      const ctx = createMockCtx();
      drawFrame(ctx as unknown as CanvasRenderingContext2D, { type: "simple", color: "#000000" }, 200, 200);
      expect(ctx.restore).toHaveBeenCalled();
    });

    it("ctx.strokeRect() が呼ばれること", () => {
      const ctx = createMockCtx();
      drawFrame(ctx as unknown as CanvasRenderingContext2D, { type: "simple", color: "#000000" }, 200, 200);
      expect(ctx.strokeRect).toHaveBeenCalled();
    });
  });

  describe("各フレームタイプで ctx.save / ctx.restore が対になって呼ばれること", () => {
    const drawableTypes: FrameType[] = [
      "simple",
      "rounded",
      "ornate",
      "elegant",
      "pop",
      "business",
      "festive",
    ];

    for (const type of drawableTypes) {
      it(`type="${type}" で save/restore が呼ばれること`, () => {
        const ctx = createMockCtx();
        drawFrame(ctx as unknown as CanvasRenderingContext2D, { type, color: "#000000" }, 200, 200);
        expect(ctx.save).toHaveBeenCalledTimes(1);
        expect(ctx.restore).toHaveBeenCalledTimes(1);
      });
    }
  });
});
