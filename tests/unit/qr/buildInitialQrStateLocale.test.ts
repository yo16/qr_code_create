import { buildInitialQrState } from "@/lib/qr/buildInitialQrState";
import { enClient } from "@/i18n/enClient";
import { jaClient } from "@/i18n/jaClient";

/**
 * buildInitialQrState の decoration 辞書引数（qr_code_create-01z.4）。
 * /en/create?preset=business でキャプションを英語にするため、QrGenerator が useDict() の decoration を渡す。
 */
describe("buildInitialQrState の decorationDict", () => {
  // 意図: en の decoration 辞書を渡すと、プリセットのキャプションが英語になる
  it("en の辞書を渡すと business のキャプションが英語", () => {
    const { state } = buildInitialQrState({ preset: "business" }, enClient.decoration);
    expect(state.decoration.preset).toBe("business");
    expect(state.decoration.caption.text).toBe(enClient.decoration.presets.business.caption);
    expect(state.decoration.caption.text).toBe("Learn more");
  });

  // 意図: 辞書を渡さなければ従来どおり ja のキャプション
  it("辞書を省略すると ja のキャプション", () => {
    const { state } = buildInitialQrState({ preset: "business" });
    expect(state.decoration.caption.text).toBe(jaClient.decoration.presets.business.caption);
    expect(state.decoration.caption.text).not.toBe("Learn more");
  });

  // 意図: 辞書を変えても色・フレームなど文言以外は同じ
  it("en と ja で色とフレームは同じ", () => {
    const a = buildInitialQrState({ preset: "business" }, enClient.decoration);
    const b = buildInitialQrState({ preset: "business" });
    expect(a.frameConfig).toEqual(b.frameConfig);
    expect(a.state.decoration.fgColor).toBe(b.state.decoration.fgColor);
    expect(a.state.decoration.bgColor).toBe(b.state.decoration.bgColor);
    expect(a.state.decoration.frameType).toBe(b.state.decoration.frameType);
  });
});
