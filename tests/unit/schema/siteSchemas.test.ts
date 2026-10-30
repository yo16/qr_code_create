import fs from "fs";
import path from "path";
import { LOCALES } from "@/i18n/locales";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";
import { localePath } from "@/lib/i18n/routes";
import { buildMetadata, getLocalePageMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";
import {
  buildOrganizationSchema,
  buildWebApplicationSchema,
  buildWebSiteSchema,
} from "@/lib/schema/buildJsonLd";

/**
 * qr_code_create-gx4: WebSite / Organization / WebApplication の構造化データ。
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";
const ORGANIZATION_ID = `${SITE_URL}/#organization`;

describe("buildWebSiteSchema", () => {
  describe.each(LOCALES)("locale=%s", (locale) => {
    const schema = buildWebSiteSchema(locale);

    it("@type が WebSite で name がサイト名", () => {
      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("WebSite");
      expect(schema.name).toBe("QR Code Create");
    });

    it("url がその言語のトップの絶対 URL で、トップの canonical と同じ表記", () => {
      expect(schema.url).toBe(`${SITE_URL}${localePath(locale, "/")}`);
      const meta =
        locale === "ja"
          ? buildMetadata(PAGE_METADATA.home, "ja")
          : buildMetadata(getLocalePageMetadata(locale).home, locale);
      expect(schema.url).toBe(meta.alternates?.canonical);
    });

    it("inLanguage が LOCALE_CONFIG の htmlLang", () => {
      expect(schema.inLanguage).toBe(LOCALE_CONFIG[locale].htmlLang);
    });

    it("@id が url + #website、publisher.@id が Organization の @id", () => {
      expect(schema["@id"]).toBe(`${schema.url}#website`);
      expect(schema.publisher).toEqual({ "@id": ORGANIZATION_ID });
    });
  });

  // 異常系: 言語間で url と @id が重複しない
  it("全言語で url と @id が互いに異なる", () => {
    const schemas = LOCALES.map((l) => buildWebSiteSchema(l));
    expect(new Set(schemas.map((s) => s.url)).size).toBe(LOCALES.length);
    expect(new Set(schemas.map((s) => s["@id"])).size).toBe(LOCALES.length);
  });

  it("引数なしは ja と同じ", () => {
    expect(buildWebSiteSchema()).toEqual(buildWebSiteSchema("ja"));
  });
});

describe("buildOrganizationSchema", () => {
  describe.each(LOCALES)("locale=%s", (locale) => {
    const schema = buildOrganizationSchema(locale);

    it("@type が Organization で @id が ORGANIZATION_ID、url が SITE_URL", () => {
      expect(schema["@type"]).toBe("Organization");
      expect(schema["@id"]).toBe(ORGANIZATION_ID);
      expect(schema.url).toBe(SITE_URL);
    });

    it("description が空でない文字列", () => {
      expect(typeof schema.description).toBe("string");
      expect(schema.description.length).toBeGreaterThan(0);
    });
  });

  it("logo が絶対 URL で、public に実在するファイルを指す", () => {
    const { logo } = buildOrganizationSchema();
    expect(logo.startsWith(`${SITE_URL}/`)).toBe(true);
    const file = path.join(process.cwd(), "public", ...logo.slice(SITE_URL.length + 1).split("/"));
    expect(fs.existsSync(file)).toBe(true);
    expect(fs.statSync(file).size).toBeGreaterThan(0);
  });

  // 異常系: WebSite の publisher が指す @id が Organization の @id と食い違わない
  it("WebSite.publisher.@id が Organization.@id と一致する", () => {
    for (const l of LOCALES) {
      expect(buildWebSiteSchema(l).publisher["@id"]).toBe(buildOrganizationSchema(l)["@id"]);
    }
  });
});

describe("buildWebApplicationSchema", () => {
  it.each(LOCALES)("locale=%s: url がその言語の /create で WebApplication", (locale) => {
    const schema = buildWebApplicationSchema(locale);
    expect(schema["@type"]).toBe("WebApplication");
    expect(schema.url).toBe(`${SITE_URL}${localePath(locale, "/create")}`);
    expect(schema.inLanguage).toBe(LOCALE_CONFIG[locale].htmlLang);
  });

  it.each(LOCALES)("locale=%s: url が /create の canonical と同じ表記", (locale) => {
    const meta =
      locale === "ja"
        ? buildMetadata(PAGE_METADATA.create, "ja")
        : buildMetadata(getLocalePageMetadata(locale).create, locale);
    expect(buildWebApplicationSchema(locale).url).toBe(meta.alternates?.canonical);
  });

  // 異常系: トップの URL を指していない
  it("url はどの言語でもトップの URL と異なる", () => {
    for (const l of LOCALES) {
      expect(buildWebApplicationSchema(l).url).not.toBe(buildWebSiteSchema(l).url);
    }
  });
});
