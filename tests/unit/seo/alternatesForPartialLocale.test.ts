import { alternatesFor } from "@/lib/seo/alternates";

/**
 * alternatesFor（合成設定）。M4 で言語を足したとき、一部の言語だけがパスを持つ構成でも
 * paths に無い言語が出ないことを固定する。設計: doc/design/i18n-multi.md 7 節
 */

jest.mock("@/i18n/locales", () => {
  const LOCALES = ["ja", "en", "es"] as const;
  return {
    LOCALES,
    NON_JA_LOCALES: LOCALES.filter((l) => l !== "ja"),
  };
});

jest.mock("@/lib/i18n/localeConfig", () => ({
  LOCALE_CONFIG: {
    ja: { prefix: "", hreflang: "ja", ogLocale: "ja_JP", paths: "all" },
    en: { prefix: "/en", hreflang: "en", ogLocale: "en_US", paths: ["/", "/create"] },
    es: { prefix: "/es", hreflang: "es", ogLocale: "es_ES", paths: ["/create", "/guide/x"] },
  },
}));

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

describe("alternatesFor: 一部の言語だけがパスを持つ合成設定", () => {
  // 意図: es が持つ /create は 3 言語 + x-default
  it("/create は ja / en / es + x-default", () => {
    expect(alternatesFor("/create")?.languages).toEqual({
      ja: `${SITE_URL}/create`,
      en: `${SITE_URL}/en/create`,
      es: `${SITE_URL}/es/create`,
      "x-default": `${SITE_URL}/create`,
    });
  });

  // 意図: es が持たない / には es が出ない
  it("/ は ja / en + x-default（es は出ない）", () => {
    const languages = alternatesFor("/")?.languages ?? {};
    expect(languages).toEqual({
      ja: `${SITE_URL}/`,
      en: `${SITE_URL}/en`,
      "x-default": `${SITE_URL}/`,
    });
    expect(languages).not.toHaveProperty("es");
  });

  // 意図: ja 以外のどの言語も持たないパスは undefined
  it("どの非 ja 言語にも無い /faq は undefined", () => {
    expect(alternatesFor("/faq")).toBeUndefined();
  });

  // 意図: es だけが持つパスでは en が出ない（hasVersion("en") だけを見る誤実装の検出）
  it("/guide/x は ja / es + x-default（en は出ない）", () => {
    const languages = alternatesFor("/guide/x")?.languages ?? {};
    expect(languages).toEqual({
      ja: `${SITE_URL}/guide/x`,
      es: `${SITE_URL}/es/guide/x`,
      "x-default": `${SITE_URL}/guide/x`,
    });
    expect(languages).not.toHaveProperty("en");
  });

  // 意図: bareRoot でも言語ごとのパスの有無は変わらない
  it("bareRoot でも es は /create にだけ出る", () => {
    expect(alternatesFor("/", { bareRoot: true })?.languages).toEqual({
      ja: SITE_URL,
      en: `${SITE_URL}/en`,
      "x-default": SITE_URL,
    });
    expect(alternatesFor("/create", { bareRoot: true })?.languages).toHaveProperty("es", `${SITE_URL}/es/create`);
  });
});
