import { INITIAL_QR_STATE } from "@/types/qr";
import type { CaptionConfig, DecorationConfig } from "@/types/qr";
import { DECORATION_PRESETS } from "@/lib/constants/decorationPresets";

describe("CaptionConfig 型整合性", () => {
  describe("INITIAL_QR_STATE.decoration.caption", () => {
    it("caption が CaptionConfig 型のオブジェクトであること", () => {
      const caption = INITIAL_QR_STATE.decoration.caption;
      expect(caption).toHaveProperty("text");
      expect(caption).toHaveProperty("fontSize");
    });

    it("caption.text の初期値が空文字であること", () => {
      expect(INITIAL_QR_STATE.decoration.caption.text).toBe("");
    });

    it("caption.fontSize の初期値が 14 であること", () => {
      expect(INITIAL_QR_STATE.decoration.caption.fontSize).toBe(14);
    });

    it("caption が string 型でないこと（旧型でないこと）", () => {
      expect(typeof INITIAL_QR_STATE.decoration.caption).toBe("object");
      expect(typeof INITIAL_QR_STATE.decoration.caption).not.toBe("string");
    });
  });

  describe("DecorationConfig.caption の型構造", () => {
    it("DecorationConfig として有効なオブジェクトを構築できること", () => {
      const config: DecorationConfig = {
        fgColor: "#000000",
        bgColor: "#ffffff",
        logo: null,
        frameType: null,
        caption: { text: "テスト", fontSize: 16 },
        preset: null,
      };
      expect(config.caption.text).toBe("テスト");
      expect(config.caption.fontSize).toBe(16);
    });
  });

  describe("DECORATION_PRESETS との整合性", () => {
    it("全プリセットの caption が CaptionConfig 型であること", () => {
      for (const preset of DECORATION_PRESETS) {
        expect(preset.caption).toHaveProperty("text");
        expect(preset.caption).toHaveProperty("fontSize");
        expect(typeof preset.caption.text).toBe("string");
        expect(typeof preset.caption.fontSize).toBe("number");
      }
    });

    it("プリセットの caption.fontSize が妥当な範囲（10-24）であること", () => {
      for (const preset of DECORATION_PRESETS) {
        expect(preset.caption.fontSize).toBeGreaterThanOrEqual(10);
        expect(preset.caption.fontSize).toBeLessThanOrEqual(24);
      }
    });
  });
});
