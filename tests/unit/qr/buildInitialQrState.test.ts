import { buildInitialQrState } from "@/lib/qr/buildInitialQrState";
import { INITIAL_QR_STATE } from "@/types/qr";
import { DEFAULT_FRAME_CONFIG } from "@/lib/qr/frameRenderer";
import { DECORATION_PRESETS } from "@/lib/constants/decorationPresets";

/**
 * buildInitialQrState のテスト
 *
 * parseCreateSearchParams が返す CreateInitialParams を受け取り、
 * QrGenerator の useState 初期値（QrState と FrameConfig）を組み立てる純関数。
 *
 * 契約:
 *   - 引数なし / 空なら INITIAL_QR_STATE と DEFAULT_FRAME_CONFIG のコピー（同一参照ではない）
 *   - preset があれば該当 DecorationPreset の fgColor / bgColor / frameType / caption / id を
 *     decoration に適用し、frameConfig を { type: preset.frameType, color: preset.frameColor } にする
 *   - utmSource があれば state.utm.source に設定し utmEnabled を true にする
 *   - utmMedium があれば state.utm.medium に設定（既定は "qr"）
 * PresetSelector の onApplyPreset と同じ結果になることで、
 * 「URL から来た」場合と「手で選んだ」場合で見た目が揃う。
 */
describe("buildInitialQrState", () => {
  const elegant = DECORATION_PRESETS.find((p) => p.id === "elegant")!;

  describe("引数なし: 既定値のコピー", () => {
    it("引数なしで state が INITIAL_QR_STATE と等価であること", () => {
      // 意図: クエリなしで /create を開いたとき、従来どおりの初期状態になること（後方互換）。
      const { state } = buildInitialQrState();
      expect(state).toEqual(INITIAL_QR_STATE);
    });

    it("引数なしで state が INITIAL_QR_STATE と別参照であること", () => {
      // 意図: useState に共有定数をそのまま渡すと、どこかで変更された場合に
      //       モジュール全体の既定値が汚染される。必ずコピーを返すこと。
      const { state } = buildInitialQrState();
      expect(state).not.toBe(INITIAL_QR_STATE);
    });

    it("引数なしで frameConfig が DEFAULT_FRAME_CONFIG と等価かつ別参照であること", () => {
      // 意図: FrameConfig も同様にコピーを返す。
      const { frameConfig } = buildInitialQrState();
      expect(frameConfig).toEqual(DEFAULT_FRAME_CONFIG);
      expect(frameConfig).not.toBe(DEFAULT_FRAME_CONFIG);
    });

    it("空オブジェクト {} でも引数なしと同じ結果になること", () => {
      // 意図: parseCreateSearchParams が空オブジェクトを返したときの経路。
      const { state, frameConfig } = buildInitialQrState({});
      expect(state).toEqual(INITIAL_QR_STATE);
      expect(frameConfig).toEqual(DEFAULT_FRAME_CONFIG);
    });
  });

  describe("preset の適用", () => {
    it("preset 'elegant' で decoration.preset が 'elegant' になること", () => {
      // 意図: PresetSelector の currentPresetId に反映され、選択中プリセットとして表示される。
      const { state } = buildInitialQrState({ preset: "elegant" });
      expect(state.decoration.preset).toBe("elegant");
    });

    it("preset 'elegant' で fgColor / bgColor が DECORATION_PRESETS の elegant と一致すること", () => {
      // 意図: 値をハードコードせず DECORATION_PRESETS から引くこと（定義変更への追従）。
      const { state } = buildInitialQrState({ preset: "elegant" });
      expect(state.decoration.fgColor).toBe(elegant.fgColor);
      expect(state.decoration.bgColor).toBe(elegant.bgColor);
    });

    it("preset 'elegant' で frameType と caption が elegant と一致すること", () => {
      // 意図: PresetSelector の onApplyPreset と同じフィールドを適用すること。
      const { state } = buildInitialQrState({ preset: "elegant" });
      expect(state.decoration.frameType).toBe(elegant.frameType);
      expect(state.decoration.caption).toEqual(elegant.caption);
    });

    it("preset 'elegant' で frameConfig が { type: elegant.frameType, color: elegant.frameColor } になること", () => {
      // 意図: FrameSelector / QrPreview に渡る frameConfig も同時に更新されないと、
      //       decoration.frameType と frameConfig.type が食い違い、プレビューにフレームが出ない。
      const { frameConfig } = buildInitialQrState({ preset: "elegant" });
      expect(frameConfig).toEqual({ type: elegant.frameType, color: elegant.frameColor });
    });

    it("preset 適用時も logo は null のままで、utm は既定値のままであること", () => {
      // 意図: preset はロゴや UTM に影響しない（責務の分離）。
      const { state } = buildInitialQrState({ preset: "elegant" });
      expect(state.decoration.logo).toBeNull();
      expect(state.utm).toEqual(INITIAL_QR_STATE.utm);
      expect(state.utmEnabled).toBe(INITIAL_QR_STATE.utmEnabled);
    });

    it.each(DECORATION_PRESETS.map((p) => p.id))(
      "preset '%s' で decoration と frameConfig が該当プリセットの値になること",
      (presetId) => {
        // 意図: elegant 以外のプリセットも同じロジックで適用されること。
        const preset = DECORATION_PRESETS.find((p) => p.id === presetId)!;
        const { state, frameConfig } = buildInitialQrState({ preset: presetId });
        expect(state.decoration.preset).toBe(preset.id);
        expect(state.decoration.fgColor).toBe(preset.fgColor);
        expect(state.decoration.bgColor).toBe(preset.bgColor);
        expect(state.decoration.frameType).toBe(preset.frameType);
        expect(state.decoration.caption).toEqual(preset.caption);
        expect(frameConfig).toEqual({ type: preset.frameType, color: preset.frameColor });
      }
    );
  });

  describe("utmSource / utmMedium の適用", () => {
    it("utmSource 'poster' で utm.source が 'poster' になること", () => {
      // 意図: 用途別ページ（ポスター）からの流入で、UTM ビルダーに source が入力済みの状態で始まる。
      const { state } = buildInitialQrState({ utmSource: "poster" });
      expect(state.utm.source).toBe("poster");
    });

    it("utmSource 'poster' で utmEnabled が true になること", () => {
      // 意図: source を入れても UTM が OFF だと URL に反映されないため、明示的に ON にする。
      const { state } = buildInitialQrState({ utmSource: "poster" });
      expect(state.utmEnabled).toBe(true);
    });

    it("utmSource のみ指定時、utm.medium は既定の 'qr' のままであること", () => {
      // 意図: utmMedium 未指定なら INITIAL_QR_STATE.utm.medium ("qr") を維持し、空にしない。
      const { state } = buildInitialQrState({ utmSource: "poster" });
      expect(state.utm.medium).toBe("qr");
    });

    it("utmMedium 'print' で utm.medium が 'print' になること", () => {
      // 意図: medium の上書きができること。
      const { state } = buildInitialQrState({ utmMedium: "print" });
      expect(state.utm.medium).toBe("print");
    });

    it("utmSource 指定時も campaign / term / content は空のままであること", () => {
      // 意図: URL から渡されないフィールドを勝手に埋めない。
      const { state } = buildInitialQrState({ utmSource: "poster", utmMedium: "qr" });
      expect(state.utm.campaign).toBe("");
      expect(state.utm.term).toBe("");
      expect(state.utm.content).toBe("");
    });

    it("utmSource 指定時も decoration は既定値のままであること", () => {
      // 意図: UTM は装飾に影響しない（責務の分離）。
      const { state, frameConfig } = buildInitialQrState({ utmSource: "poster" });
      expect(state.decoration).toEqual(INITIAL_QR_STATE.decoration);
      expect(frameConfig).toEqual(DEFAULT_FRAME_CONFIG);
    });
  });

  describe("組み合わせ", () => {
    it("preset と utmSource の同時指定で両方が反映され、url は空のままであること", () => {
      // 意図: CTA の典型クエリ（utm_source=poster&utm_medium=qr&preset=elegant）の経路。
      //       URL 本体はユーザーが入力するものなので、クエリから決して補完しない。
      const { state, frameConfig } = buildInitialQrState({
        preset: "elegant",
        utmSource: "poster",
        utmMedium: "qr",
      });
      expect(state.decoration.preset).toBe("elegant");
      expect(state.decoration.fgColor).toBe(elegant.fgColor);
      expect(frameConfig.type).toBe(elegant.frameType);
      expect(state.utm.source).toBe("poster");
      expect(state.utm.medium).toBe("qr");
      expect(state.utmEnabled).toBe(true);
      expect(state.url).toBe("");
      expect(state.isUrlValid).toBe(false);
      expect(state.currentStep).toBe(INITIAL_QR_STATE.currentStep);
    });
  });

  describe("純粋性: 既定値を変更しない", () => {
    it("preset / utmSource を適用しても INITIAL_QR_STATE と DEFAULT_FRAME_CONFIG が変更されないこと", () => {
      // 意図: 共有定数を破壊的に書き換えると、同一セッションで /create を開き直したときに
      //       前回の preset が残る。呼び出し後に既定値が元のままであることを検証する。
      buildInitialQrState({ preset: "elegant", utmSource: "poster", utmMedium: "print" });
      expect(INITIAL_QR_STATE.decoration.preset).toBeNull();
      expect(INITIAL_QR_STATE.decoration.fgColor).toBe("#000000");
      expect(INITIAL_QR_STATE.utm.source).toBe("");
      expect(INITIAL_QR_STATE.utm.medium).toBe("qr");
      expect(DEFAULT_FRAME_CONFIG).toEqual({ type: "none", color: "#000000" });
    });

    it("2 回呼び出しても互いに独立したオブジェクトを返すこと", () => {
      // 意図: 戻り値をキャッシュして同じ参照を返す実装になっていないこと。
      const first = buildInitialQrState({ preset: "elegant" });
      const second = buildInitialQrState({ preset: "elegant" });
      expect(first.state).toEqual(second.state);
      expect(first.state).not.toBe(second.state);
      expect(first.frameConfig).not.toBe(second.frameConfig);
    });
  });
});
