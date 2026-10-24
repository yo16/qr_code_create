import { ja } from "@/i18n/ja";
import { en } from "@/i18n/en";
import { enClient } from "@/i18n/enClient";
import { getDict, getClientMessages } from "@/i18n/getDict";
import { CLIENT_SLICE_KEYS } from "@/i18n/types";

/**
 * 英語辞書（qr_code_create-01z.4）の単体テスト。
 * ja を正として、en がキー・型・プレースホルダで一致し、日本語が混ざっていないことを固定する。
 */

type Leaf = { path: string; value: unknown };

/** 葉（オブジェクト・配列以外）をパス付きで列挙する */
function collectLeaves(node: unknown, prefix = ""): Leaf[] {
  if (node !== null && typeof node === "object") {
    return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
      collectLeaves(v, prefix ? `${prefix}.${k}` : k)
    );
  }
  return [{ path: prefix, value: node }];
}

/** 葉のパスと、その値の型（関数・文字列など）の対応表 */
function leafTypes(node: unknown): Map<string, string> {
  return new Map(collectLeaves(node).map((l) => [l.path, typeof l.value]));
}

const jaTypes = leafTypes(ja);
const enTypes = leafTypes(en);
const enLeaves = collectLeaves(en);

// ひらがな・カタカナ・漢字・全角記号（CJK 記号と句読点、全角英数・記号）
const JAPANESE = /[　-〿぀-ゟ゠-ヿ一-鿿＀-￯]/;
const PLACEHOLDER = /\{(\w+)\}/g;
const placeholders = (s: string) =>
  Array.from(s.matchAll(PLACEHOLDER), (m) => m[1]).sort();

describe("en 辞書のキー構成", () => {
  // 意図: ja にあって en に無いキー（欠落）と、en にだけあるキー（余剰）がどちらも無い
  it("en と ja の葉のパス集合が一致する（欠落・余剰をパスで表示）", () => {
    const missing = [...jaTypes.keys()].filter((p) => !enTypes.has(p));
    const extra = [...enTypes.keys()].filter((p) => !jaTypes.has(p));
    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });

  // 意図: トップレベルのスライス名が一致する（Server / Client スライスとも）
  it("トップレベルのスライス名が一致する", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ja).sort());
  });

  // 意図: 葉の型が ja と同じ（関数値があれば en も関数、文字列なら文字列）
  it("各葉の型が ja と同じ", () => {
    const mismatched = [...jaTypes.entries()]
      .filter(([p, t]) => enTypes.has(p) && enTypes.get(p) !== t)
      .map(([p, t]) => `${p}: ja=${t} en=${enTypes.get(p)}`);
    expect(mismatched).toEqual([]);
  });

  // 意図: 空振り防止（走査が実際に多数の葉を見ている）
  it("葉を十分な数だけ走査している", () => {
    expect(enLeaves.length).toBeGreaterThan(150);
  });
});

describe("en 辞書の値", () => {
  // 意図: 文字列の葉は空でない。ただし ja でも空文字のキー（simple プリセットのキャプション）は空でよい
  it("文字列の葉は空でない（ja で空のものを除く）", () => {
    const jaLeafValues = new Map(collectLeaves(ja).map((l) => [l.path, l.value]));
    const empty = enLeaves
      .filter((l) => typeof l.value === "string" && (l.value as string).trim() === "")
      .filter((l) => jaLeafValues.get(l.path) !== "")
      .map((l) => l.path);
    expect(empty).toEqual([]);
  });

  // 意図: 葉は string か関数だけ（数値や undefined が紛れ込んでいない）
  it("葉は string か function のいずれか", () => {
    const bad = enLeaves
      .filter((l) => typeof l.value !== "string" && typeof l.value !== "function")
      .map((l) => `${l.path}: ${typeof l.value}`);
    expect(bad).toEqual([]);
  });

  // 意図: 英語辞書に日本語（仮名・漢字・全角記号）が残っていない
  // 例外: 設計 10.2 の言語切り替えラベル（自言語名）だけは日本語を許す
  it("文字列の葉に日本語が含まれない（common.languageSwitch.label を除く）", () => {
    const withJa = enLeaves
      .filter((l) => typeof l.value === "string" && JAPANESE.test(l.value as string))
      .map((l) => `${l.path}: ${l.value as string}`);
    expect(withJa).toEqual(["common.languageSwitch.label: 日本語"]);
  });

  // 意図: 検出用の正規表現が日本語を拾い、英語を拾わない（検査ロジックの確認）
  it("日本語検出の正規表現が仮名・漢字・全角記号を拾い英語を拾わない", () => {
    expect(JAPANESE.test("ひらがな")).toBe(true);
    expect(JAPANESE.test("カタカナ")).toBe(true);
    expect(JAPANESE.test("漢字")).toBe(true);
    expect(JAPANESE.test("A。")).toBe(true);
    expect(JAPANESE.test("Ａ")).toBe(true);
    expect(JAPANESE.test("Make a printable poster → (e.g. qr)")).toBe(false);
  });

  // 意図: {n} などの差し込み名がキーごとに ja と同じ（format で値が入らない事故を防ぐ）
  it("プレースホルダの集合がキーごとに ja と一致する", () => {
    const jaLeafValues = new Map(collectLeaves(ja).map((l) => [l.path, l.value]));
    const diff = enLeaves
      .filter((l) => typeof l.value === "string")
      .flatMap((l) => {
        const jaValue = jaLeafValues.get(l.path);
        if (typeof jaValue !== "string") return [];
        const a = placeholders(jaValue).join(",");
        const b = placeholders(l.value as string).join(",");
        return a === b ? [] : [`${l.path}: ja={${a}} en={${b}}`];
      });
    expect(diff).toEqual([]);
  });

  // 意図: プレースホルダを持つ葉が実際にある（上のテストの空振り防止）
  it("プレースホルダを含む葉がある", () => {
    expect(en.tool.download.fileSize).toContain("{n}");
    expect(en.ui.progressBar.defaultLabel).toContain("{current}");
  });

  // 意図: プリセットのキャプションとテンプレートは、CaptionEditor の上限（MAX_LENGTH = 15）に収まる。
  // 超えると適用直後から「長すぎる」警告が出てしまう
  it.each([
    ["ja", ja],
    ["en", en],
  ] as const)("%s のプリセット caption と templates が 15 文字以内", (_name, dict) => {
    const CAPTION_MAX_LENGTH = 15;
    const values = [
      ...Object.entries(dict.decoration.presets).map(([k, p]) => [`presets.${k}.caption`, p.caption]),
      ...Object.entries(dict.decoration.caption.templates).map(([k, v]) => [`templates.${k}`, v]),
    ];
    expect(values.length).toBeGreaterThanOrEqual(10);
    const tooLong = values
      .filter(([, v]) => v.length > CAPTION_MAX_LENGTH)
      .map(([k, v]) => `${k}: "${v}" (${v.length})`);
    expect(tooLong).toEqual([]);
  });

  // 意図: ヘッダーの CTA と、Client 側のモバイルメニュー CTA が同じ文言
  it("header.cta と common.mobileMenu.cta が同じ", () => {
    expect(en.header.cta).toBe(en.common.mobileMenu.cta);
  });
});

describe("getDict / getClientMessages の en", () => {
  // 意図: getDict("en") が英語辞書そのものを返す
  it('getDict("en") は en、getDict("ja") は ja', () => {
    expect(getDict("en")).toBe(en);
    expect(getDict("ja")).toBe(ja);
  });

  // 意図: Client に渡すのは Client スライスだけ（Server スライスが Client に流れない）
  it('getClientMessages("en") は Client スライスだけを持つ', () => {
    const messages = getClientMessages("en");
    expect(Object.keys(messages).sort()).toEqual([...CLIENT_SLICE_KEYS].sort());
    for (const key of CLIENT_SLICE_KEYS) {
      expect(messages[key]).toBe(en[key]);
    }
    expect(messages).not.toHaveProperty("header");
    expect(messages).not.toHaveProperty("home");
  });

  // 意図: enClient は Client スライスちょうど
  it("Object.keys(enClient) が CLIENT_SLICE_KEYS と一致する", () => {
    expect(Object.keys(enClient).sort()).toEqual([...CLIENT_SLICE_KEYS].sort());
  });

  // 意図: en の Client スライスは enClient と同一参照（二重定義していない）
  it.each([...CLIENT_SLICE_KEYS])("en.%s は enClient の同じオブジェクト", (key) => {
    expect(en[key]).toBe(enClient[key]);
  });
});
