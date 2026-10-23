import { parseCreateSearchParams } from "@/lib/url/parseCreateSearchParams";
import { DECORATION_PRESETS } from "@/lib/constants/decorationPresets";
import { UTM_SOURCE_OPTIONS, UTM_MEDIUM_OPTIONS } from "@/lib/constants/utmPresets";

/**
 * parseCreateSearchParams のテスト
 *
 * 用途別ページの CTA（buildCreateHref）が生成する
 *   /create?utm_source=poster&utm_medium=qr&preset=elegant
 * のクエリを /create 側で読み取り、QrGenerator の初期状態に渡す
 * CreateInitialParams へ変換する純関数。
 * 設計（doc/design/page-routing.md 2.5）「/create ページはクエリパラメータから初期値を設定する」に基づく。
 *
 * 契約:
 *   - preset      は DECORATION_PRESETS の id に一致する場合のみ採用
 *   - utm_source  は UTM_SOURCE_OPTIONS の value に一致する場合のみ採用
 *   - utm_medium  は UTM_MEDIUM_OPTIONS の value に一致する場合のみ採用
 *   - 不一致・空文字・未指定・null はキーを省略（undefined）
 * URL は外部から自由に書き換えられるため、ホワイトリスト以外の値を state に流し込まないことが重要。
 */
describe("parseCreateSearchParams", () => {
  describe("正常系: 有効なパラメータ", () => {
    it("preset / utm_source / utm_medium がすべて有効なら 3 つとも採用されること", () => {
      // 意図: buildCreateHref が生成する典型的なクエリをそのまま往復できること。
      const params = new URLSearchParams(
        "utm_source=poster&utm_medium=qr&preset=elegant"
      );
      expect(parseCreateSearchParams(params)).toEqual({
        preset: "elegant",
        utmSource: "poster",
        utmMedium: "qr",
      });
    });

    it("preset のみ指定なら preset だけが採用され、utmSource / utmMedium は undefined であること", () => {
      // 意図: ガイドページ等から preset だけ付けて遷移するケース。UTM を勝手に補完しない。
      const result = parseCreateSearchParams(new URLSearchParams("preset=business"));
      expect(result).toEqual({ preset: "business" });
      expect(result.utmSource).toBeUndefined();
      expect(result.utmMedium).toBeUndefined();
    });

    it.each(DECORATION_PRESETS.map((p) => p.id))(
      "DECORATION_PRESETS の id '%s' はすべて preset として採用されること",
      (presetId) => {
        // 意図: ホワイトリストが DECORATION_PRESETS と同期していること（ハードコード漏れの検出）。
        const result = parseCreateSearchParams(new URLSearchParams(`preset=${presetId}`));
        expect(result.preset).toBe(presetId);
      }
    );

    it.each(UTM_SOURCE_OPTIONS.map((o) => o.value))(
      "UTM_SOURCE_OPTIONS の value '%s' はすべて utmSource として採用されること",
      (source) => {
        // 意図: 用途別ページの frontmatter が取り得る utmSource をすべて受け付けること。
        const result = parseCreateSearchParams(new URLSearchParams(`utm_source=${source}`));
        expect(result.utmSource).toBe(source);
      }
    );

    it.each(UTM_MEDIUM_OPTIONS.map((o) => o.value))(
      "UTM_MEDIUM_OPTIONS の value '%s' はすべて utmMedium として採用されること",
      (medium) => {
        // 意図: qr / print の両方を受け付けること。
        const result = parseCreateSearchParams(new URLSearchParams(`utm_medium=${medium}`));
        expect(result.utmMedium).toBe(medium);
      }
    );
  });

  describe("異常系: ホワイトリスト外の値は省略", () => {
    it("不正な preset（'gold'）は省略され、他の有効なパラメータは採用されること", () => {
      // 意図: 存在しないプリセット id が decoration.preset に入ると PresetSelector の表示が壊れるため除外する。
      //       1 つが不正でも他のパラメータは独立して採用されること。
      const result = parseCreateSearchParams(
        new URLSearchParams("utm_source=poster&utm_medium=qr&preset=gold")
      );
      expect(result.preset).toBeUndefined();
      expect(result).toEqual({ utmSource: "poster", utmMedium: "qr" });
    });

    it("不正な utm_source（'tv'）は省略されること", () => {
      // 意図: UTM_SOURCE_OPTIONS にない値を自動で UTM ON にしてしまうと、
      //       意図しない utm_source が QR コードの URL に焼き込まれるため除外する。
      const result = parseCreateSearchParams(
        new URLSearchParams("utm_source=tv&preset=elegant")
      );
      expect(result.utmSource).toBeUndefined();
      expect(result).toEqual({ preset: "elegant" });
    });

    it("不正な utm_medium（'email'）は省略されること", () => {
      // 意図: medium は qr / print のみ。既定値 'qr' を上書きさせない。
      const result = parseCreateSearchParams(
        new URLSearchParams("utm_source=poster&utm_medium=email")
      );
      expect(result.utmMedium).toBeUndefined();
      expect(result).toEqual({ utmSource: "poster" });
    });

    it("空文字（preset=&utm_source=&utm_medium=）はすべて省略され空オブジェクトになること", () => {
      // 意図: 'preset=' のように値が空のクエリを「空文字のプリセット」として扱わないこと。
      const result = parseCreateSearchParams(
        new URLSearchParams("preset=&utm_source=&utm_medium=")
      );
      expect(result).toEqual({});
      expect(result.preset).toBeUndefined();
      expect(result.utmSource).toBeUndefined();
      expect(result.utmMedium).toBeUndefined();
    });

    it("大文字小文字が異なる値（'Elegant', 'POSTER'）は一致とみなさず省略されること", () => {
      // 意図: id / value は小文字固定。緩い比較で意図しないマッチをさせない。
      const result = parseCreateSearchParams(
        new URLSearchParams("preset=Elegant&utm_source=POSTER")
      );
      expect(result).toEqual({});
    });
  });

  describe("境界値: 入力なし", () => {
    it("null を渡すと空オブジェクトを返すこと", () => {
      // 意図: useSearchParams は null を返し得る（Suspense 外・初期描画）。例外を投げずに空を返す。
      expect(parseCreateSearchParams(null)).toEqual({});
    });

    it("undefined を渡すと空オブジェクトを返すこと", () => {
      // 意図: 引数省略時も安全に動作すること。
      expect(parseCreateSearchParams(undefined)).toEqual({});
    });

    it("空の URLSearchParams を渡すと空オブジェクトを返すこと", () => {
      // 意図: クエリなしで /create に直接アクセスした場合。
      expect(parseCreateSearchParams(new URLSearchParams())).toEqual({});
    });
  });

  describe("無関係なクエリ", () => {
    it("無関係なクエリ（foo=bar）は無視され、結果に含まれないこと", () => {
      // 意図: 任意のクエリキーをそのまま返す実装（Object.fromEntries 等）になっていないこと。
      const result = parseCreateSearchParams(new URLSearchParams("foo=bar"));
      expect(result).toEqual({});
      expect(result).not.toHaveProperty("foo");
    });

    it("無関係なクエリと有効なクエリが混在しても有効なものだけ採用されること", () => {
      // 意図: GA の gclid 等、他のトラッキングパラメータが付いていても preset 等の読み取りに影響しないこと。
      const result = parseCreateSearchParams(
        new URLSearchParams("gclid=abc123&preset=pop&ref=twitter")
      );
      expect(result).toEqual({ preset: "pop" });
      expect(result).not.toHaveProperty("gclid");
      expect(result).not.toHaveProperty("ref");
    });
  });
});
