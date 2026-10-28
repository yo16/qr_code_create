import { getClientMessages, getDict } from "@/i18n/getDict";
import { flattenDict, placeholders } from "../../helpers/glossary";

/** de 辞書の品質テスト（qr_code_create-38x.8） */
const JAPANESE = /[　-〿぀-ゟ゠-ヿ一-鿿＀-￯]/;
const KANA_EXEMPT_KEYS = new Set(["common.languageSwitch.label"]);

/** キーを問わず、en と同じでよい語（固有名詞、記号、ドイツ語としても正しい語） */
const SAME_AS_EN_ANY_KEY = new Set<string>([
  "",
  "QR Code Create",
  "PNG",
  "SVG",
  "PDF",
  "URL",
  "UTM",
  "Google Analytics",
  "Business",
  "Elegant",
  "Pop",
  "FAQ",
  "Blog",
  "Logo",
  "Browser",
  "Standard",
  "Flyer",
  "Poster",
]);

/** キーと値の組で許可する、en と同じ文言 */
const SAME_AS_EN_BY_KEY: Readonly<Record<string, string>> = {
  "common.languageSwitch.label": "日本語",
  "ui.tabs.listAria": "Tabs",
  "decoration.logo.alt": "Logo: {fileName}",
  "tool.urlInput.placeholder": "https://example.com",
};

function leftoversOf(entries: { key: string; value: string }[], enValues: Map<string, string>): string[] {
  return entries
    .filter((l) => enValues.get(l.key) === l.value)
    .filter((l) => !SAME_AS_EN_ANY_KEY.has(l.value) && SAME_AS_EN_BY_KEY[l.key] !== l.value)
    .map((l) => `${l.key}: ${l.value}`);
}

const de = flattenDict(getDict("de"));
const en = flattenDict(getDict("en"));
const enByKey = new Map(en.map((l) => [l.key, l.value]));
const deByKey = new Map(de.map((l) => [l.key, l.value]));

/** 英語の機能語（単語として）。固有名詞と例は先に取り除く */
const ENGLISH_FUNCTION_WORDS = /(?<![\p{L}\p{N}_-])(?:the|and|your|with|you|for)(?![\p{L}\p{N}_-])/iu;

describe("de 辞書", () => {
  it("葉が 1 件以上ある（空振り防止）", () => {
    expect(de.length).toBeGreaterThan(100);
  });

  it("キー集合が en と同じ", () => {
    expect([...deByKey.keys()].sort()).toEqual([...enByKey.keys()].sort());
  });

  it("かな・漢字が無い（例外は common.languageSwitch.label のみ）", () => {
    const offenders = de.filter((l) => !KANA_EXEMPT_KEYS.has(l.key) && JAPANESE.test(l.value));
    expect(offenders).toEqual([]);
  });

  it("例外キー common.languageSwitch.label は日本語の自言語名を持つ", () => {
    expect(deByKey.get("common.languageSwitch.label")).toBe("日本語");
  });

  it("schema.inLanguage が de", () => {
    expect(getDict("de").schema.inLanguage).toBe("de");
  });

  it("英語のまま残った文言が無い（キー指定の許可と、絞った語の許可以外）", () => {
    expect(leftoversOf(de, enByKey)).toEqual([]);
  });

  it("検出ロジックの確認: 英語の文や別キーの許可値は残存として拾える", () => {
    const enValues = new Map([
      ["a.b", "Download the file"],
      ["ui.other", "Tabs"],
      ["tool.urlInput.placeholder", "https://example.com"],
    ]);
    const sample = [
      { key: "a.b", value: "Download the file" },
      { key: "ui.other", value: "Tabs" },
      { key: "tool.urlInput.placeholder", value: "https://example.com" },
    ];
    expect(leftoversOf(sample, enValues)).toEqual(["a.b: Download the file", "ui.other: Tabs"]);
  });

  it("辞書の葉に英語の機能語（the / and / your / with / you / for）が単語として出ない", () => {
    const offenders = de
      .map((l) => ({
        key: l.key,
        text: l.value.replace(/QR Code Create/g, "").replace(/https?:\/\/\S+/g, "").replace(/qr code generator/g, ""),
      }))
      .filter((l) => ENGLISH_FUNCTION_WORDS.test(l.text))
      .map((l) => `${l.key}: ${l.text}`);
    expect(offenders).toEqual([]);
  });

  it("機能語の検出自体は動く", () => {
    expect(ENGLISH_FUNCTION_WORDS.test("Download the file")).toBe(true);
    expect(ENGLISH_FUNCTION_WORDS.test("Laden Sie die Datei herunter")).toBe(false);
  });

  it("プレースホルダの集合が全キーで en と同じ", () => {
    const mismatches = de
      .filter((l) => placeholders(l.value).join(",") !== placeholders(enByKey.get(l.key) ?? "").join(","))
      .map((l) => l.key);
    expect(mismatches).toEqual([]);
  });

  it("getClientMessages(\"de\") の値が de 辞書の該当キーと一致する", () => {
    const client = flattenDict(getClientMessages("de"));
    expect(client.length).toBeGreaterThan(0);
    for (const { key, value } of client) {
      expect(deByKey.get(key)).toBe(value);
    }
  });
});
