import {
  ALTERNATE_PATHS,
  buildMetadata,
  getGuideAlternatePaths,
  PAGE_METADATA,
  PAGE_METADATA_EN,
} from "@/lib/metadata/buildMetadata";
import { getGuideSlugList } from "@/lib/content/getGuide";

/**
 * hreflang（alternates.languages）と og:locale / alternateLocale（qr_code_create-01z.7）。
 * 設計: doc/design/i18n-en.md 7.1
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

type Og = { locale?: string; alternateLocale?: string | string[] };
const og = (m: ReturnType<typeof buildMetadata>) => m.openGraph as Og;

describe("alternatePaths なし", () => {
  const opts = { title: "t", description: "d", path: "/faq" };

  // 意図: 片方の言語にしか無いページは hreflang も alternateLocale も出さない（ja / en とも）
  it.each(["ja", "en"] as const)("%s: alternates.languages と openGraph.alternateLocale が無い", (locale) => {
    const meta = buildMetadata(opts, locale);
    expect(meta.alternates).toEqual({ canonical: `${SITE_URL}/faq` });
    expect(meta.alternates).not.toHaveProperty("languages");
    expect(og(meta)).not.toHaveProperty("alternateLocale");
  });
});

describe("alternatePaths あり", () => {
  const alternatePaths = { ja: "/create", en: "/en/create" };

  // 意図: languages は ja / en / x-default の 3 キーだけで、x-default は ja を指す
  it.each(["ja", "en"] as const)("%s: languages が 3 キーで x-default = ja", (locale) => {
    const meta = buildMetadata(
      { title: "t", description: "d", path: locale === "ja" ? "/create" : "/en/create", alternatePaths },
      locale
    );
    const languages = meta.alternates?.languages as Record<string, string>;
    expect(Object.keys(languages).sort()).toEqual(["en", "ja", "x-default"]);
    expect(languages).toEqual({
      ja: `${SITE_URL}/create`,
      en: `${SITE_URL}/en/create`,
      "x-default": `${SITE_URL}/create`,
    });
  });

  // 意図: canonical は各言語の自己 URL（相手言語や x-default に寄せない）
  it("canonical が自己 URL", () => {
    const jaMeta = buildMetadata({ title: "t", description: "d", path: "/create", alternatePaths }, "ja");
    const enMeta = buildMetadata({ title: "t", description: "d", path: "/en/create", alternatePaths }, "en");
    expect(jaMeta.alternates?.canonical).toBe(`${SITE_URL}/create`);
    expect(enMeta.alternates?.canonical).toBe(`${SITE_URL}/en/create`);
  });

  // 意図: og:locale は自分、og:locale:alternate は相手
  it("ja は locale ja_JP / alternateLocale en_US、en はその逆", () => {
    const jaMeta = buildMetadata({ title: "t", description: "d", path: "/create", alternatePaths }, "ja");
    const enMeta = buildMetadata({ title: "t", description: "d", path: "/en/create", alternatePaths }, "en");
    expect(og(jaMeta).locale).toBe("ja_JP");
    expect(og(jaMeta).alternateLocale).toEqual(["en_US"]);
    expect(og(enMeta).locale).toBe("en_US");
    expect(og(enMeta).alternateLocale).toEqual(["ja_JP"]);
  });

  // 意図: ja ホームの URL 表記。canonical と languages.ja / x-default は同じ文字列（SITE_URL + "/"）
  it("ja ホーム: canonical・languages.ja・x-default が同じ表記（SITE_URL の後ろに末尾スラッシュ）", () => {
    const meta = buildMetadata(PAGE_METADATA.home, "ja");
    const languages = meta.alternates?.languages as Record<string, string>;
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/`);
    expect(languages.ja).toBe(`${SITE_URL}/`);
    expect(languages["x-default"]).toBe(`${SITE_URL}/`);
    expect(languages.en).toBe(`${SITE_URL}/en`);
  });

  // 意図: en ホームの languages は ja ホームと同じ組
  it("en ホームの languages は ja ホームと同じ組で canonical は /en", () => {
    const jaMeta = buildMetadata(PAGE_METADATA.home, "ja");
    const enMeta = buildMetadata(PAGE_METADATA_EN.home, "en");
    expect(enMeta.alternates?.languages).toEqual(jaMeta.alternates?.languages);
    expect(enMeta.alternates?.canonical).toBe(`${SITE_URL}/en`);
  });
});

describe("ALTERNATE_PATHS と PAGE_METADATA", () => {
  // 意図: 3 ページの対応パスの値
  it("home / create の対応パス", () => {
    expect(ALTERNATE_PATHS).toEqual({
      home: { ja: "/", en: "/en" },
      create: { ja: "/create", en: "/en/create" },
    });
  });

  // 意図: ja / en の両方の PAGE_METADATA が同じ alternatePaths を持つ（相互参照の前提）
  it("PAGE_METADATA と PAGE_METADATA_EN の home / create が同じ alternatePaths", () => {
    expect(PAGE_METADATA.home.alternatePaths).toEqual(ALTERNATE_PATHS.home);
    expect(PAGE_METADATA.create.alternatePaths).toEqual(ALTERNATE_PATHS.create);
    expect(PAGE_METADATA_EN.home.alternatePaths).toEqual(ALTERNATE_PATHS.home);
    expect(PAGE_METADATA_EN.create.alternatePaths).toEqual(ALTERNATE_PATHS.create);
  });

  // 意図: 英語版の無いページには alternatePaths が無い
  it("PAGE_METADATA の home / create 以外のキーに alternatePaths が無い", () => {
    const others = Object.entries(PAGE_METADATA).filter(([key]) => key !== "home" && key !== "create");
    expect(others.length).toBeGreaterThan(0);
    for (const [key, page] of others) {
      expect({ key, has: "alternatePaths" in page }).toEqual({ key, has: false });
    }
  });
});

describe("getGuideAlternatePaths", () => {
  // 意図: 英語版のある slug だけ値を返す
  it("getting-started は ja / en の対応パス", () => {
    expect(getGuideAlternatePaths("getting-started")).toEqual({
      ja: "/guide/getting-started",
      en: "/en/guide/getting-started",
    });
  });

  // 意図: ja にしか無い slug、存在しない slug、空文字は undefined
  it.each(["utm-setup", "no-such-slug", ""])("%s は undefined", (slug) => {
    expect(getGuideAlternatePaths(slug)).toBeUndefined();
  });

  // 意図: ja の全ガイドのうち、対応パスが定義されるのは getting-started だけ
  // （ja ガイドを増やしたときに、英語版の無い slug へ hreflang が出ないことを固定する）
  it("ja の全 slug のうち getGuideAlternatePaths が定義されるのは getting-started だけ", () => {
    const slugs = getGuideSlugList();
    expect(slugs.length).toBeGreaterThan(1);
    expect(slugs).toContain("getting-started");
    const defined = slugs.filter((slug) => getGuideAlternatePaths(slug) !== undefined);
    expect(defined).toEqual(["getting-started"]);
  });
});
