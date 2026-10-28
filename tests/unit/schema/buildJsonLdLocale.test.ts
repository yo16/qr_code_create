import { buildWebApplicationSchema } from "@/lib/schema/buildJsonLd";
import { LOCALES, type Locale } from "@/i18n/locales";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";
import { localePath } from "@/lib/i18n/routes";

interface AppSchema {
  url: string;
  offers: { priceCurrency: string };
}

const build = (l?: Locale) => buildWebApplicationSchema(l) as unknown as AppSchema;

describe("buildWebApplicationSchema: locale 別", () => {
  it.each([...LOCALES])("%s: priceCurrency が設定と一致し url が作成ページで終わる", (l) => {
    const s = build(l);
    expect(s.offers.priceCurrency).toBe(LOCALE_CONFIG[l].currency);
    expect(s.url.endsWith(localePath(l, "/create"))).toBe(true);
  });

  it("en は url が /en/create を含み priceCurrency が USD", () => {
    const s = build("en");
    expect(s.url).toContain("/en/create");
    expect(s.offers.priceCurrency).toBe("USD");
  });

  it("ja は url が /en/ を含まず priceCurrency が JPY", () => {
    const s = build("ja");
    expect(s.url).not.toContain("/en/");
    expect(s.offers.priceCurrency).toBe("JPY");
  });

  it("引数なしは ja と同じ", () => {
    expect(build()).toEqual(build("ja"));
  });
});
