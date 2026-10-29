import { TERM_IDS } from "@/i18n/glossary/terms";
import { deGlossary, deGlossaryOptions } from "@/i18n/glossary/de";
import { getDict } from "@/i18n/getDict";
import { checkGlossary, flattenDict, readGuideTexts } from "../../helpers/glossary";

/** de の用語集テスト（qr_code_create-38x.8）。辞書と de ガイドが用語集に従う */
describe("de の用語集", () => {
  it("checkGlossary が空配列を返す", () => {
    expect(checkGlossary("de", deGlossary, deGlossaryOptions)).toEqual([]);
  });

  it("用語集のキーが TERM_IDS と一致する", () => {
    expect(Object.keys(deGlossary).sort()).toEqual([...TERM_IDS].sort());
  });

  it("全項目に訳語があり、禁止語が訳語と重ならない", () => {
    for (const id of TERM_IDS) {
      expect(deGlossary[id].term.length).toBeGreaterThan(0);
      expect(deGlossary[id].forbidden).not.toContain(deGlossary[id].term);
    }
  });

  describe("呼びかけは Sie にそろえる", () => {
    const re = new RegExp(
      deGlossaryOptions.addressForbidden[0].source,
      deGlossaryOptions.addressForbidden[0].flags
    );

    it.each(["du", "dein", "deine", "dich", "dir", "euch", "Euer Logo", "Euer", "Eure Datei", "Euren", "Eurem", "Eurer", "Eures","Du kannst", "Laden Sie dich herunter"])(
      "禁止パターンは %s を検出する",
      (text) => {
        expect(re.test(text)).toBe(true);
      }
    );

    it.each(["Euro", "Europa", "Eurasien", "teuer", "neuer"])("%s は検出しない", (text) => {
      expect(re.test(`Das Wort ${text} ist erlaubt`)).toBe(false);
    });

    it("三人称の小文字 sie と敬称 Sie は検出しない", () => {
      expect(re.test("Sie können die Datei herunterladen")).toBe(false);
      expect(re.test("Wenn sie fertig ist, laden Sie sie herunter.")).toBe(false);
    });

    it("duplizieren のように du で始まる語は検出しない", () => {
      expect(re.test("Sie können das Design duplizieren")).toBe(false);
    });

    it("辞書とガイドに禁止語が無い", () => {
      const dictTexts = flattenDict(getDict("de")).map((l) => l.value);
      const guideTexts = readGuideTexts("de").map((g) => g.text);
      expect(guideTexts.length).toBeGreaterThan(0);
      for (const text of [...dictTexts, ...guideTexts]) {
        expect(re.test(text)).toBe(false);
      }
    });
  });

  it("異常系: 禁止語を含む辞書では checkGlossary が失敗を返す", () => {
    const broken = { ...deGlossary, qrCode: { term: "QR-Codex", forbidden: [] as string[] } };
    expect(checkGlossary("de", broken, deGlossaryOptions).length).toBeGreaterThan(0);
  });
});
