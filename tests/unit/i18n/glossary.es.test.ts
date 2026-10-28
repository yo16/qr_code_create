import { esGlossary, addressForbidden } from "@/i18n/glossary/es";
import { TERM_IDS } from "@/i18n/glossary/terms";
import { getDict } from "@/i18n/getDict";
import { checkGlossary, flattenDict, readGuideTexts, wordRegExp } from "../../helpers/glossary";

/**
 * es の用語集（qr_code_create-38x.6）。checkGlossary が禁止語・必須語・呼びかけ（tú）・記号のそろいを検査する。
 */

describe("es の用語集", () => {
  it("checkGlossary が失敗を返さない", () => {
    expect(checkGlossary("es", esGlossary, { addressForbidden })).toEqual([]);
  });

  it("用語集のキーが TERM_IDS と一致する", () => {
    expect(Object.keys(esGlossary).sort()).toEqual([...TERM_IDS].sort());
  });

  it("すべての用語に訳語があり、禁止語は訳語と重ならない", () => {
    for (const id of TERM_IDS) {
      const { term, forbidden } = esGlossary[id];
      expect(term.trim()).not.toBe("");
      expect(forbidden.map((w) => w.toLowerCase())).not.toContain(term.toLowerCase());
    }
  });

  it("空振り防止: 辞書とガイドを実際に読めている", () => {
    expect(flattenDict(getDict("es")).length).toBeGreaterThan(150);
    expect(readGuideTexts("es").length).toBeGreaterThan(0);
  });
});

describe("es の呼びかけ（tú）の禁止語", () => {
  const joined = [
    ...flattenDict(getDict("es")).map((l) => l.value),
    ...readGuideTexts("es").map((g) => g.text),
  ].join("\n");

  it("usted / ustedes / vos / vosotros 系が辞書にもガイドにも無い", () => {
    for (const re of addressForbidden) {
      expect(re.test(joined)).toBe(false);
    }
  });

  it("検出用の正規表現は usted 系を拾い、tú の文は拾わない（異常系の確認）", () => {
    const [re] = addressForbidden;
    expect(re.test("Escriba su URL, usted puede descargar")).toBe(true);
    expect(re.test("Vuestro código QR")).toBe(true);
    expect(re.test("Escribe tu URL y descarga el código QR")).toBe(false);
    // 語の一部では拾わない
    expect(re.test("la envoltura")).toBe(false);
  });

  it("禁止語（preset など）は語境界つきで照合され、diseños predefinidos は許される", () => {
    expect(wordRegExp("preset").test("Diseños predefinidos")).toBe(false);
    expect(wordRegExp("preset").test("Elige un preset")).toBe(true);
  });
});
