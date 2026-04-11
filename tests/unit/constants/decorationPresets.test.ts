import { DECORATION_PRESETS, type DecorationPreset } from "@/lib/constants/decorationPresets";

describe("decorationPresets", () => {
  describe("DECORATION_PRESETS", () => {
    it("5つのプリセットを含むこと", () => {
      expect(DECORATION_PRESETS).toHaveLength(5);
    });

    it("各プリセットにid/name/description/fgColor/bgColor/frameType/captionTextが定義されていること", () => {
      for (const preset of DECORATION_PRESETS) {
        expect(preset).toHaveProperty("id");
        expect(preset).toHaveProperty("name");
        expect(preset).toHaveProperty("description");
        expect(preset).toHaveProperty("fgColor");
        expect(preset).toHaveProperty("bgColor");
        expect(preset).toHaveProperty("frameType");
        expect(preset).toHaveProperty("captionText");

        expect(typeof preset.id).toBe("string");
        expect(preset.id.length).toBeGreaterThan(0);

        expect(typeof preset.name).toBe("string");
        expect(preset.name.length).toBeGreaterThan(0);

        expect(typeof preset.description).toBe("string");
        expect(preset.description.length).toBeGreaterThan(0);

        expect(typeof preset.fgColor).toBe("string");
        expect(typeof preset.bgColor).toBe("string");
        expect(typeof preset.frameType).toBe("string");
        expect(typeof preset.captionText).toBe("string");
      }
    });

    it("IDが重複しないこと", () => {
      const ids = DECORATION_PRESETS.map((preset) => preset.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("全fgColorが#で始まるHEX形式であること", () => {
      const hexPattern = /^#[0-9a-fA-F]{6}$/;
      for (const preset of DECORATION_PRESETS) {
        expect(preset.fgColor).toMatch(hexPattern);
      }
    });

    it("全bgColorが#で始まるHEX形式であること", () => {
      const hexPattern = /^#[0-9a-fA-F]{6}$/;
      for (const preset of DECORATION_PRESETS) {
        expect(preset.bgColor).toMatch(hexPattern);
      }
    });
  });
});
