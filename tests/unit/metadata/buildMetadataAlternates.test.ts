import {
  buildMetadata,
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

describe("jaPath なし", () => {
  const opts = { title: "t", description: "d", path: "/faq" };

  // 意図: 片方の言語にしか無いページは hreflang も alternateLocale も出さない（ja / en とも）
  it.each(["ja", "en"] as const)("%s: alternates.languages と openGraph.alternateLocale が無い", (locale) => {
    const meta = buildMetadata(opts, locale);
    expect(meta.alternates).toEqual({ canonical: `${SITE_URL}/faq` });
    expect(meta.alternates).not.toHaveProperty("languages");
    expect(og(meta)).not.toHaveProperty("alternateLocale");
  });
});

describe("jaPath あり", () => {
  const jaPath = "/create";

  // 意図: languages は ja / en / x-default の 3 キーだけで、x-default は ja を指す
  it.each(["ja", "en"] as const)("%s: languages が 3 キーで x-default = ja", (locale) => {
    const meta = buildMetadata(
      { title: "t", description: "d", path: locale === "ja" ? "/create" : "/en/create", jaPath },
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
    const jaMeta = buildMetadata({ title: "t", description: "d", path: "/create", jaPath }, "ja");
    const enMeta = buildMetadata({ title: "t", description: "d", path: "/en/create", jaPath }, "en");
    expect(jaMeta.alternates?.canonical).toBe(`${SITE_URL}/create`);
    expect(enMeta.alternates?.canonical).toBe(`${SITE_URL}/en/create`);
  });

  // 意図: og:locale は自分、og:locale:alternate は相手
  it("ja は locale ja_JP / alternateLocale en_US、en はその逆", () => {
    const jaMeta = buildMetadata({ title: "t", description: "d", path: "/create", jaPath }, "ja");
    const enMeta = buildMetadata({ title: "t", description: "d", path: "/en/create", jaPath }, "en");
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

describe("jaPath と PAGE_METADATA", () => {
  // 意図: 3 ページの jaPath の値
  it("home / create の jaPath", () => {
    expect(PAGE_METADATA.home.jaPath).toBe("/");
    expect(PAGE_METADATA.create.jaPath).toBe("/create");
  });

  // 意図: ja / en の両方の PAGE_METADATA が同じ jaPath を持つ（相互参照の前提）
  it("PAGE_METADATA と PAGE_METADATA_EN の home / create が同じ jaPath", () => {
    expect(PAGE_METADATA_EN.home.jaPath).toEqual(PAGE_METADATA.home.jaPath);
    expect(PAGE_METADATA_EN.create.jaPath).toEqual(PAGE_METADATA.create.jaPath);
  });

  // 意図: 英語版の無いページには jaPath が無い
  it("PAGE_METADATA の home / create 以外のキーに jaPath が無い", () => {
    const others = Object.entries(PAGE_METADATA).filter(([key]) => key !== "home" && key !== "create");
    expect(others.length).toBeGreaterThan(0);
    for (const [key, page] of others) {
      expect({ key, has: "jaPath" in page }).toEqual({ key, has: false });
    }
  });
});

describe("ガイドの jaPath", () => {
  const guideMeta = (slug: string) =>
    buildMetadata({ title: "t", description: "d", path: `/guide/${slug}`, jaPath: `/guide/${slug}` }, "ja");

  // 意図: 英語版のある slug だけ hreflang が出る
  it("getting-started は ja / en / x-default", () => {
    expect(guideMeta("getting-started").alternates?.languages).toEqual({
      ja: `${SITE_URL}/guide/getting-started`,
      en: `${SITE_URL}/en/guide/getting-started`,
      "x-default": `${SITE_URL}/guide/getting-started`,
    });
  });

  // 意図: ja にしか無い slug、存在しない slug は languages を出さない
  it.each(["utm-setup", "no-such-slug"])("%s は languages が無い", (slug) => {
    expect(guideMeta(slug).alternates).not.toHaveProperty("languages");
  });

  // 意図: ja の全ガイドのうち、hreflang が出るのは getting-started だけ
  // （ja ガイドを増やしたときに、英語版の無い slug へ hreflang が出ないことを固定する）
  it("ja の全 slug のうち languages が出るのは getting-started だけ", () => {
    const slugs = getGuideSlugList();
    expect(slugs.length).toBeGreaterThan(1);
    expect(slugs).toContain("getting-started");
    const defined = slugs.filter((slug) => guideMeta(slug).alternates?.languages !== undefined);
    expect(defined).toEqual(["getting-started"]);
  });
});
