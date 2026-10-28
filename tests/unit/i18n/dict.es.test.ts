import { en } from "@/i18n/en";
import { es } from "@/i18n/es";
import { getDict, getClientMessages } from "@/i18n/getDict";
import { CLIENT_SLICE_KEYS } from "@/i18n/types";
import { flattenDict, placeholders } from "../../helpers/glossary";

/**
 * es 辞書（qr_code_create-38x.6）。M4 では英語の写しだったので、英語のまま残った文言が無いことを固定する。
 */

const JAPANESE = /[　-〿぀-ゟ゠-ヿ一-鿿＀-￯]/;
const esLeaves = flattenDict(es);
const enByKey = new Map(flattenDict(en).map((l) => [l.key, l.value]));

/** en と同じ値のままでよい文言（固有名詞・記号・URL の例・綴りが同じ語）。キーごとに理由が分かる範囲だけ */
const SAME_AS_EN_ALLOWED = new Set([
  "", // simple プリセットのキャプションなど
  "URL",
  "https://example.com",
  "Simple",
  "Pop",
  "Blog",
  "QR Code Create",
]);

describe("es 辞書の文字種", () => {
  it("葉に仮名・漢字・全角記号が無い（common.languageSwitch.label を除く）", () => {
    const withJa = esLeaves
      .filter((l) => JAPANESE.test(l.value))
      .map((l) => `${l.key}: ${l.value}`);
    expect(withJa).toEqual(["common.languageSwitch.label: 日本語"]);
  });

  it("検出用の正規表現は日本語を拾い、スペイン語（ñ・á・¿）を拾わない", () => {
    expect(JAPANESE.test("日本語")).toBe(true);
    expect(JAPANESE.test("ダウンロード")).toBe(true);
    expect(JAPANESE.test("¿Cómo descargar el código QR? Año")).toBe(false);
  });

  it("葉を十分な数だけ走査している", () => {
    expect(esLeaves.length).toBeGreaterThan(150);
  });
});

describe("es 辞書のメタ情報", () => {
  it('schema.inLanguage が "es"', () => {
    expect(es.schema.inLanguage).toBe("es");
  });

  it("文字列の葉は空でない（en で空のものを除く）", () => {
    const empty = esLeaves
      .filter((l) => l.value.trim() === "" && enByKey.get(l.key) !== "")
      .map((l) => l.key);
    expect(empty).toEqual([]);
  });
});

describe("es 辞書に英語が残っていない", () => {
  it("en と同じ値の葉は許可リストの語だけ", () => {
    const sameAsEn = esLeaves
      .filter((l) => enByKey.get(l.key) === l.value && l.key !== "common.languageSwitch.label")
      .filter((l) => !SAME_AS_EN_ALLOWED.has(l.value))
      .map((l) => `${l.key}: ${l.value}`);
    expect(sameAsEn).toEqual([]);
  });

  it("許可リストの語が本当に en と同じ値で現れている（許可リストの空振り防止）", () => {
    const sameValues = new Set(esLeaves.filter((l) => enByKey.get(l.key) === l.value && l.key !== "common.languageSwitch.label").map((l) => l.value));
    expect(sameValues.size).toBeGreaterThan(0);
    for (const v of sameValues) expect(SAME_AS_EN_ALLOWED.has(v)).toBe(true);
  });

  it("主要な英語の見出し・ボタンが es 辞書に出てこない", () => {
    const values = esLeaves.map((l) => l.value);
    for (const english of [
      en.header.cta,
      en.tool.pageHeading,
      en.home.hero.primaryCta,
      en.home.hero.secondaryCta,
      en.tool.download.pngButton,
      en.common.notFound.title,
    ]) {
      expect(values).not.toContain(english);
    }
  });
});

describe("es 辞書の構成", () => {
  it("en と葉のキー集合が一致する", () => {
    const esKeys = esLeaves.map((l) => l.key).sort();
    const enKeys = [...enByKey.keys()].sort();
    expect(esKeys).toEqual(enKeys);
  });

  it("プレースホルダ（{xxx}）の集合が全キーで en と同じ", () => {
    const diff = esLeaves.flatMap((l) => {
      const enValue = enByKey.get(l.key);
      if (enValue === undefined) return [];
      const a = placeholders(l.value).join(",");
      const b = placeholders(enValue).join(",");
      return a === b ? [] : [`${l.key}: es={${a}} en={${b}}`];
    });
    expect(diff).toEqual([]);
  });

  it("プレースホルダを含む葉がある（上のテストの空振り防止）", () => {
    expect(es.tool.download.fileSize).toContain("{n}");
    expect(es.ui.progressBar.defaultLabel).toContain("{current}");
    expect(es.ui.progressBar.defaultLabel).toContain("{total}");
  });

  it("header.cta と common.mobileMenu.cta が同じ", () => {
    expect(es.header.cta).toBe(es.common.mobileMenu.cta);
  });
});

describe('getDict("es") / getClientMessages("es")', () => {
  it('getDict("es") は es 辞書そのもの', () => {
    expect(getDict("es")).toBe(es);
  });

  it("getClientMessages は Client スライスだけを持ち、値が es 辞書の該当キーと一致する", () => {
    const messages = getClientMessages("es");
    expect(Object.keys(messages).sort()).toEqual([...CLIENT_SLICE_KEYS].sort());
    for (const key of CLIENT_SLICE_KEYS) {
      expect(messages[key]).toEqual(es[key]);
    }
    expect(messages).not.toHaveProperty("header");
    expect(messages).not.toHaveProperty("home");
  });

  it("Client スライスの葉が es 辞書の葉と同じ値（キー単位）", () => {
    const esByKey = new Map(esLeaves.map((l) => [l.key, l.value]));
    const clientLeaves = flattenDict(getClientMessages("es"));
    expect(clientLeaves.length).toBeGreaterThan(100);
    for (const l of clientLeaves) expect(esByKey.get(l.key)).toBe(l.value);
  });
});
