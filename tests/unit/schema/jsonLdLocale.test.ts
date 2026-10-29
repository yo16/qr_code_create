import {
  buildBreadcrumbSchema,
  buildHowToSchema,
  buildWebApplicationSchema,
} from "@/lib/schema/buildJsonLd";

/**
 * JSON-LD の言語（qr_code_create-01z.7）。
 * 既定（ja）は旧出力のまま inLanguage を足さず、en のときだけ inLanguage "en" を出す。
 * 設計: doc/design/i18n-en.md 7.2
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

const items = [
  { name: "Home", url: `${SITE_URL}/en` },
  { name: "Getting started", url: `${SITE_URL}/en/guide/getting-started` },
];

// 旧出力（locale 引数追加前）の BreadcrumbList。直書きで固定する
const LEGACY_BREADCRUMB = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en` },
    { "@type": "ListItem", position: 2, name: "Getting started", item: `${SITE_URL}/en/guide/getting-started` },
  ],
};

const howToOptions = {
  name: "How to",
  description: "Desc",
  steps: [
    { name: "A", text: "Text A", url: "https://example.com/a" },
    { name: "B", text: "Text B" },
  ],
};

const LEGACY_HOWTO = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to",
  description: "Desc",
  totalTime: "PT3M",
  tool: { "@type": "HowToTool", name: "QR Code Create" },
  step: [
    { "@type": "HowToStep", name: "A", text: "Text A", url: "https://example.com/a" },
    { "@type": "HowToStep", name: "B", text: "Text B" },
  ],
};

describe("buildBreadcrumbSchema", () => {
  // 意図: 既定（引数なし）と "ja" は旧出力と同一で inLanguage を持たない
  it("既定と ja は旧出力と同じで inLanguage が無い", () => {
    expect(buildBreadcrumbSchema(items)).toEqual(LEGACY_BREADCRUMB);
    expect(buildBreadcrumbSchema(items, "ja")).toEqual(LEGACY_BREADCRUMB);
    expect(buildBreadcrumbSchema(items)).not.toHaveProperty("inLanguage");
  });

  // 意図: en は旧出力に inLanguage "en" を足しただけ
  it('en は inLanguage "en" が付き、ほかは同じ', () => {
    expect(buildBreadcrumbSchema(items, "en")).toEqual({ ...LEGACY_BREADCRUMB, inLanguage: "en" });
  });

  // 境界: 空配列でも壊れない
  it("空配列で itemListElement が空", () => {
    expect(buildBreadcrumbSchema([], "en").itemListElement).toEqual([]);
  });
});

describe("buildHowToSchema", () => {
  // 意図: options ありの既定 / ja は旧出力と同じ
  it("options あり: 既定と ja は旧出力と同じで inLanguage が無い", () => {
    expect(buildHowToSchema(howToOptions)).toEqual(LEGACY_HOWTO);
    expect(buildHowToSchema(howToOptions, "ja")).toEqual(LEGACY_HOWTO);
  });

  // 意図: options ありの en は inLanguage "en" を足しただけ（引数の値は辞書で上書きされない）
  it('options あり: en は inLanguage "en" が付き、ほかは同じ', () => {
    expect(buildHowToSchema(howToOptions, "en")).toEqual({ ...LEGACY_HOWTO, inLanguage: "en" });
  });
});

describe('buildWebApplicationSchema("en")', () => {
  // 意図: 言語・URL・通貨が英語版向け（ja は従来どおり）
  it('inLanguage "en"、url /en/create、priceCurrency "USD"', () => {
    const schema = buildWebApplicationSchema("en");
    expect(schema.inLanguage).toBe("en");
    expect(schema.url).toBe(`${SITE_URL}/en/create`);
    expect(schema.offers.priceCurrency).toBe("USD");
  });

  it('ja は inLanguage "ja"、url /create、priceCurrency "JPY"', () => {
    const schema = buildWebApplicationSchema();
    expect(schema.inLanguage).toBe("ja");
    expect(schema.url).toBe(`${SITE_URL}/create`);
    expect(schema.offers.priceCurrency).toBe("JPY");
  });
});
