import { en } from "@/i18n/en";
import { ptBr } from "@/i18n/ptBr";
import { getDict, getClientMessages } from "@/i18n/getDict";
import { CLIENT_SLICE_KEYS } from "@/i18n/types";
import { flattenDict, placeholders } from "../../helpers/glossary";

/**
 * pt-br 辞書（qr_code_create-38x.7）の単体テスト。
 * 日本語・英語の取り残しが無いこと、プレースホルダが en とそろうことを固定する。
 */

const JAPANESE = /[　-〿぀-ゟ゠-ヿ一-鿿＀-￯]/;

const ptLeaves = flattenDict(ptBr);
const enByKey = new Map(flattenDict(en).map((l) => [l.key, l.value]));
const ptByKey = new Map(ptLeaves.map((l) => [l.key, l.value]));

/** en と同じ値のままでよい葉（固有名詞・記号・URL の例など）。値で許可する */
const SAME_VALUE_ALLOWED = new Set<string>([
  "",
  "QR Code Create",
  "PNG",
  "SVG",
  "PDF",
  "URL",
  "UTM",
  "Google Analytics",
  "Pop",
  "Casual",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  // 英語と同形の語（ポルトガル語でも Blog / Logo）と、自言語名（日本語）
  "Blog",
  "Logo: {fileName}",
  "日本語",
]);

const looksLikeUrlOrDomain = (v: string) =>
  /^(https?:\/\/|www\.)/.test(v) || /^[\w.-]+\.(com|jp|org|net|io)(\/\S*)?$/.test(v) || /^utm_\w+$/.test(v);

describe("pt-br 辞書の文字種", () => {
  it("葉を十分な数だけ走査している", () => {
    expect(ptLeaves.length).toBeGreaterThan(150);
  });

  it("仮名・漢字を含む葉は common.languageSwitch.label の「日本語」だけ", () => {
    const withJa = ptLeaves.filter((l) => JAPANESE.test(l.value)).map((l) => `${l.key}: ${l.value}`);
    expect(withJa).toEqual(["common.languageSwitch.label: 日本語"]);
  });

  it("検出用の正規表現が日本語を拾いポルトガル語を拾わない", () => {
    expect(JAPANESE.test("日本語")).toBe(true);
    expect(JAPANESE.test("ひらがな")).toBe(true);
    expect(JAPANESE.test("Criar código com ação, não é")).toBe(false);
  });

  it("schema.inLanguage が pt-BR", () => {
    expect(ptBr.schema.inLanguage).toBe("pt-BR");
  });
});

describe("pt-br 辞書に英語が残っていない", () => {
  const same = ptLeaves.filter((l) => enByKey.get(l.key) === l.value);

  it("en と同じ値の葉は許可リスト（固有名詞・記号・URL 例）だけ", () => {
    const unexpected = same
      .filter((l) => !SAME_VALUE_ALLOWED.has(l.value) && !looksLikeUrlOrDomain(l.value))
      .map((l) => `${l.key}: ${l.value}`);
    expect(unexpected).toEqual([]);
  });

  // 異常系: 判定が空振りしていない
  it("許可リスト判定が通常の英語文を許可しない", () => {
    expect(SAME_VALUE_ALLOWED.has("Create a QR code")).toBe(false);
    expect(looksLikeUrlOrDomain("Create a QR code")).toBe(false);
    expect(looksLikeUrlOrDomain("https://example.com/")).toBe(true);
  });

  it("主要な見出しが en の値と違う", () => {
    for (const key of ["tool.pageHeading", "home.hero.headingLine1", "header.cta"]) {
      expect(ptByKey.get(key)).toBeDefined();
      expect(ptByKey.get(key)).not.toBe(enByKey.get(key));
    }
  });
});

describe("pt-br 辞書の構成", () => {
  it("葉のパス集合が en と一致する", () => {
    const missing = [...enByKey.keys()].filter((k) => !ptByKey.has(k));
    const extra = [...ptByKey.keys()].filter((k) => !enByKey.has(k));
    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });

  it("プレースホルダの集合が全キーで en と同じ", () => {
    const diff = ptLeaves.flatMap((l) => {
      const e = enByKey.get(l.key);
      if (e === undefined) return [];
      const a = placeholders(l.value).join(",");
      const b = placeholders(e).join(",");
      return a === b ? [] : [`${l.key}: pt-br={${a}} en={${b}}`];
    });
    expect(diff).toEqual([]);
  });

  it("プレースホルダを含む葉がある（空振り防止）", () => {
    expect(ptBr.tool.download.fileSize).toContain("{n}");
  });

  it("空文字の葉は en でも空文字", () => {
    const empty = ptLeaves.filter((l) => l.value === "" && enByKey.get(l.key) !== "").map((l) => l.key);
    expect(empty).toEqual([]);
  });
});

describe('getDict / getClientMessages の "pt-br"', () => {
  it('getDict("pt-br") は ptBr 辞書そのもの', () => {
    expect(getDict("pt-br")).toBe(ptBr);
  });

  it("getClientMessages は Client スライスだけを持ち、値が pt-br 辞書と一致する", () => {
    const messages = getClientMessages("pt-br");
    expect(Object.keys(messages).sort()).toEqual([...CLIENT_SLICE_KEYS].sort());
    for (const key of CLIENT_SLICE_KEYS) {
      expect(messages[key]).toEqual(ptBr[key]);
    }
    expect(messages).not.toHaveProperty("header");
    expect(messages).not.toHaveProperty("home");
  });

  it("getClientMessages の葉が pt-br 辞書の該当キーと一致する", () => {
    const clientLeaves = flattenDict(getClientMessages("pt-br"));
    expect(clientLeaves.length).toBeGreaterThan(50);
    const mismatched = clientLeaves.filter((l) => ptByKey.get(l.key) !== l.value).map((l) => l.key);
    expect(mismatched).toEqual([]);
  });
});
