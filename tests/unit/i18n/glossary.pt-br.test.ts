import { checkGlossary, flattenDict, readGuideTexts, wordRegExp } from "../../helpers/glossary";
import { ptBrGlossary, ptBrAddressForbidden } from "@/i18n/glossary/ptBr";
import { TERM_IDS } from "@/i18n/glossary/terms";
import { getDict } from "@/i18n/getDict";

/**
 * pt-br の用語集テスト（qr_code_create-38x.7）。
 * 共通処理 checkGlossary に用語集を渡し、失敗が 0 件であることを確かめる。
 */

describe("pt-br 用語集", () => {
  it("checkGlossary の失敗が 0 件", () => {
    const failures = checkGlossary("pt-br", ptBrGlossary, { addressForbidden: ptBrAddressForbidden });
    expect(failures).toEqual([]);
  });

  it("用語集のキーが TERM_IDS と一致する", () => {
    expect(Object.keys(ptBrGlossary).sort()).toEqual([...TERM_IDS].sort());
  });

  it("各項目に空でない term と forbidden 配列がある", () => {
    for (const id of TERM_IDS) {
      expect(ptBrGlossary[id].term.trim()).not.toBe("");
      expect(Array.isArray(ptBrGlossary[id].forbidden)).toBe(true);
    }
  });

  // 意図: 欧州ポルトガル語の語彙が辞書とガイドに混ざっていない（checkGlossary と独立の確認）
  it.each(["ficheiro", "ecrã", "utilizador", "telemóvel", "equipa", "registo", "transferir", "descarregar"])(
    "欧州ポルトガル語の語「%s」が辞書とガイドに無い",
    (word) => {
      const re = wordRegExp(word);
      const dictHits = flattenDict(getDict("pt-br")).filter((l) => re.test(l.value)).map((l) => l.key);
      const guideHits = readGuideTexts("pt-br").filter((g) => re.test(g.text)).map((g) => g.file);
      expect({ dictHits, guideHits }).toEqual({ dictHits: [], guideHits: [] });
    }
  );

  // 異常系: 検査が空振りしていない（欧州語彙を含む用語集では失敗が出る）
  it("禁止語に実在する訳語を入れた用語集では checkGlossary が失敗を返す", () => {
    const bad = { ...ptBrGlossary, download: { term: "baixar", forbidden: ["baixar"] } };
    const failures = checkGlossary("pt-br", bad, { addressForbidden: ptBrAddressForbidden });
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.some((f) => f.includes("禁止語「baixar」"))).toBe(true);
  });

  it("呼びかけの禁止語 (tu / ficheiro) の正規表現が該当語を拾い você を拾わない", () => {
    const [address, european] = ptBrAddressForbidden;
    expect(address.test("Você pode baixar")).toBe(false);
    expect(address.test("Podes usar o teu QR Code")).toBe(true);
    expect(european.test("Guarde o ficheiro")).toBe(true);
    expect(european.test("Guarde o arquivo")).toBe(false);
  });
});
