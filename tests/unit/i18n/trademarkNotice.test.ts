// 意図（qr_code_create-7mk）: 「QRコード」の登録商標の表記は、デンソーウェーブの公式 FAQ の例文のまま。
// 言い換えてはいけないので、期待値は辞書から読まず文字列で直接書く
import { getDict } from "@/i18n/getDict";
import { LOCALES } from "@/i18n/locales";
import type { Locale } from "@/i18n/types";

const EXPECTED: Record<Locale, string> = {
  ja: "QRコードは株式会社デンソーウェーブの登録商標です。",
  en: "QR Code is a registered trademark of DENSO WAVE INCORPORATED in Japan and in other countries.",
  es: "QR Code es una marca registrada de DENSO WAVE INCORPORATED en Japón y en otros países.",
  "pt-br": "QR Code é uma marca registrada da DENSO WAVE INCORPORATED no Japão e em outros países.",
  de: "QR Code ist eine eingetragene Marke von DENSO WAVE INCORPORATED in Japan und in anderen Ländern.",
};

describe("footer.trademarkNotice", () => {
  it("検査対象が全言語であること（言語を足したら期待値も足す）", () => {
    expect([...LOCALES].sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it.each(Object.entries(EXPECTED))("%s は公式の例文と一字一句同じ", (locale, text) => {
    expect(getDict(locale as Locale).footer.trademarkNotice).toBe(text);
  });

  it.each(["en", "es", "pt-br", "de"] as const)("%s は訳語でなく「QR Code」と書き、DENSO WAVE INCORPORATED を含む", (l) => {
    const t = getDict(l).footer.trademarkNotice;
    expect(t).toContain("QR Code");
    expect(t).not.toMatch(/código QR|QR-Code|QR code/);
    expect(t).toContain("DENSO WAVE INCORPORATED");
  });

  it("ja は「株式会社デンソーウェーブ」と「QRコード」を含む", () => {
    const t = getDict("ja").footer.trademarkNotice;
    expect(t).toContain("株式会社デンソーウェーブ");
    expect(t).toContain("QRコード");
  });

  it("言語ごとに文が違う（他言語の文を取り違えていない）", () => {
    const all = LOCALES.map((l) => getDict(l).footer.trademarkNotice);
    expect(new Set(all).size).toBe(LOCALES.length);
  });
});
