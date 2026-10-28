import { LOCALE_CONFIG, TRANSLATED_PATHS } from "@/lib/i18n/localeConfig";

// 設計書 5.2 節の値の固定（es の currency は USD で承認済み）
describe("LOCALE_CONFIG: es / pt-br / de", () => {
  it("es", () => {
    expect(LOCALE_CONFIG.es).toEqual({
      prefix: "/es",
      htmlLang: "es",
      hreflang: "es",
      ogLocale: "es_ES",
      currency: "USD",
      nativeName: "Español",
      shortName: "Español",
      paths: TRANSLATED_PATHS,
      poster: false,
    });
  });

  it("pt-br", () => {
    expect(LOCALE_CONFIG["pt-br"]).toEqual({
      prefix: "/pt-br",
      htmlLang: "pt-BR",
      hreflang: "pt-BR",
      ogLocale: "pt_BR",
      currency: "BRL",
      nativeName: "Português (Brasil)",
      shortName: "Português",
      paths: TRANSLATED_PATHS,
      poster: false,
    });
  });

  it("de", () => {
    expect(LOCALE_CONFIG.de).toEqual({
      prefix: "/de",
      htmlLang: "de",
      hreflang: "de",
      ogLocale: "de_DE",
      currency: "EUR",
      nativeName: "Deutsch",
      shortName: "Deutsch",
      paths: TRANSLATED_PATHS,
      poster: false,
    });
  });

  it("TRANSLATED_PATHS は設計書どおり", () => {
    expect([...TRANSLATED_PATHS]).toEqual(["/", "/create", "/guide/getting-started"]);
  });
});
