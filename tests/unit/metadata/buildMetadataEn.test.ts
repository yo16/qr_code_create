import { buildMetadata, PAGE_METADATA_EN } from "@/lib/metadata/buildMetadata";
import { buildWebApplicationSchema } from "@/lib/schema/buildJsonLd";
import { getDict } from "@/i18n/getDict";

/**
 * 英語版の metadata と JSON-LD（qr_code_create-01z.4）。
 */

const JAPANESE = /[　-〿぀-ゟ゠-ヿ一-鿿＀-￯]/;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

describe("buildMetadata の en", () => {
  // 意図: en の OGP ロケールは en_US（ja は ja_JP のまま）
  it('openGraph.locale は en で "en_US"、ja で "ja_JP"', () => {
    const opts = { title: "t", description: "d", path: "/en" };
    const enMeta = buildMetadata(opts, "en").openGraph as { locale?: string };
    const jaMeta = buildMetadata(opts, "ja").openGraph as { locale?: string };
    expect(enMeta.locale).toBe("en_US");
    expect(jaMeta.locale).toBe("ja_JP");
  });

  // 意図: create の canonical が英語 URL で、インデックス対象（robots 指定なし）
  it("PAGE_METADATA_EN.create の canonical が /en/create、robots が undefined", () => {
    const meta = buildMetadata(PAGE_METADATA_EN.create, "en");
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/en/create`);
    expect(meta.robots).toBeUndefined();
  });
});

describe("PAGE_METADATA_EN", () => {
  const pages = getDict("en").meta.pages;

  // 意図: 英語版があるのは home と create だけ
  it("キーは home と create だけ", () => {
    expect(Object.keys(PAGE_METADATA_EN).sort()).toEqual(["create", "home"]);
  });

  // 意図: パスが英語版の URL
  it("path が /en と /en/create", () => {
    expect(PAGE_METADATA_EN.home.path).toBe("/en");
    expect(PAGE_METADATA_EN.create.path).toBe("/en/create");
  });

  // 意図: title / description が en 辞書から来ていて、日本語を含まず、noIndex でない
  it.each(["home", "create"] as const)("%s の title / description が en 辞書と一致し日本語なし", (key) => {
    const page = PAGE_METADATA_EN[key];
    expect(page.title).toBe(pages[key].title);
    expect(page.description).toBe(pages[key].description);
    expect(page.title).not.toMatch(JAPANESE);
    expect(page.description).not.toMatch(JAPANESE);
    expect((page as { noIndex?: boolean }).noIndex).toBeUndefined();
  });
});

describe('buildWebApplicationSchema("en")', () => {
  const schema = buildWebApplicationSchema("en");
  const dict = getDict("en").schema;

  // 意図: description と featureList が英語辞書から来ていて日本語を含まない
  it("description / featureList が英語で日本語なし", () => {
    expect(schema.description).toBe(dict.webApplication.description);
    expect(schema.featureList).toEqual(dict.webApplication.featureList);
    expect(schema.description).not.toMatch(JAPANESE);
    expect(schema.featureList.filter((f) => JAPANESE.test(f))).toEqual([]);
  });

  // 意図: 言語・URL・通貨が英語版向け
  it('inLanguage "en"、url /en/create、priceCurrency "USD"', () => {
    expect(schema.inLanguage).toBe("en");
    expect(schema.url).toBe(`${SITE_URL}/en/create`);
    expect(schema.offers.priceCurrency).toBe("USD");
  });
});
