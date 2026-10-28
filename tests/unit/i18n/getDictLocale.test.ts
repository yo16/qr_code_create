import { getDict, getClientMessages } from "@/i18n/getDict";
import { pickClientDict } from "@/i18n/client";
import { LOCALES } from "@/i18n/locales";
import { ja } from "@/i18n/ja";
import { en } from "@/i18n/en";

describe("getDict", () => {
  it("ja は日本語の辞書を返す", () => {
    expect(getDict("ja")).toBe(ja);
  });

  it("en は英語の辞書を返し、ja と代表キーが異なる", () => {
    expect(getDict("en")).toBe(en);
    expect(getDict("en").home.hero.headingLine1).not.toBe(getDict("ja").home.hero.headingLine1);
  });

  it.each([...LOCALES])("%s: 辞書が定義済みで、クライアント用スライスが pickClientDict と一致する", (l) => {
    expect(getDict(l)).toBeDefined();
    expect(getClientMessages(l)).toEqual(pickClientDict(getDict(l)));
  });

  it("getClientMessages は言語ごとに異なる", () => {
    expect(getClientMessages("en")).not.toEqual(getClientMessages("ja"));
  });
});
