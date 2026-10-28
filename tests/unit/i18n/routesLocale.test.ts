import { NON_JA_LOCALES } from "@/i18n/locales";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";
import { getAlternatePath, hasVersion, localePath, splitLocale } from "@/lib/i18n/routes";

/** 多言語 M1（qr_code_create-38x.1）。設計: doc/design/i18n-multi.md 5.3 節 */

describe("splitLocale", () => {
  it.each([
    ["/", "ja", "/"],
    ["/en", "en", "/"],
    ["/en/", "en", "/"],
    ["/en/create", "en", "/create"],
    ["/enx", "ja", "/enx"],
    ["/english", "ja", "/english"],
    ["/create", "ja", "/create"],
    ["", "ja", ""],
    ["/EN/create", "ja", "/EN/create"],
  ])("%j → locale=%s, jaPath=%j", (input, locale, jaPath) => {
    expect(splitLocale(input)).toEqual({ locale, jaPath });
  });
});

describe("splitLocale: 全 NON_JA_LOCALES の prefix 外し", () => {
  describe.each([...NON_JA_LOCALES])("%s", (l) => {
    const prefix = LOCALE_CONFIG[l].prefix;
    it("prefix 単体・末尾スラッシュ・配下を外す", () => {
      expect(splitLocale(prefix)).toEqual({ locale: l, jaPath: "/" });
      expect(splitLocale(`${prefix}/`)).toEqual({ locale: l, jaPath: "/" });
      expect(splitLocale(`${prefix}/create`)).toEqual({ locale: l, jaPath: "/create" });
    });
    it("prefix に文字が続くだけのパスは ja", () => {
      expect(splitLocale(`${prefix}x`)).toEqual({ locale: "ja", jaPath: `${prefix}x` });
    });
  });
});

describe("localePath", () => {
  it.each([
    ["ja", "/", "/"],
    ["ja", "/create", "/create"],
    ["ja", "", ""],
    ["en", "/", "/en"],
    ["en", "", "/en"],
    ["en", "/create", "/en/create"],
    ["en", "create", "/en/create"],
    ["en", "/guide/getting-started", "/en/guide/getting-started"],
  ] as const)("localePath(%s, %j) = %j", (locale, path, expected) => {
    expect(localePath(locale, path)).toBe(expected);
  });
});

describe("hasVersion", () => {
  it.each(["/", "/create", "/faq", "/poster", "/anything", ""])(
    "ja は %j でも常に true",
    (p) => {
      expect(hasVersion("ja", p)).toBe(true);
    }
  );

  it.each([
    ["/", true],
    ["/create", true],
    ["/guide/getting-started", true],
    ["/faq", false],
    ["/guide", false],
    ["/guide/utm-setup", false],
    ["", false],
    ["/en/create", false],
  ])("en の hasVersion(%j) は %s", (p, expected) => {
    expect(hasVersion("en", p)).toBe(expected);
  });

  // 実装は完全一致で比較する。末尾スラッシュ・クエリ付きは呼び出し側で除く前提
  it("末尾スラッシュ・クエリ付きのパスは完全一致しないので false", () => {
    expect(hasVersion("en", "/create/")).toBe(false);
    expect(hasVersion("en", "/create?x=1")).toBe(false);
  });
});

describe("getAlternatePath: 境界（追加）", () => {
  it("/enx は en 配下ではなく ja の /enx。to=en は英語版が無いので /en", () => {
    expect(getAlternatePath("/enx", "en")).toBe("/en");
  });

  it("/enx は to=ja でそのまま返す", () => {
    expect(getAlternatePath("/enx", "ja")).toBe("/enx");
  });

  it("/english?x=1#a は to=en で /en、to=ja で /english", () => {
    expect(getAlternatePath("/english?x=1#a", "en")).toBe("/en");
    expect(getAlternatePath("/english?x=1#a", "ja")).toBe("/english");
  });

  it("/en/create?x=1#a は to=ja で /create", () => {
    expect(getAlternatePath("/en/create?x=1#a", "ja")).toBe("/create");
  });
});
