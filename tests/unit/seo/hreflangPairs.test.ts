/**
 * @jest-environment node
 */
import type { Metadata } from "next";

/**
 * hreflang の相互参照（qr_code_create-01z.7）。
 * 実際のページモジュール（metadata export / generateMetadata）から metadata を取り、
 * 3 組（home / create / getting-started）の 6 ページが同じ 3 URL の組を出し、自己参照も含むことを確かめる。
 * 設計: doc/design/i18n-en.md 7.1。View はメタデータに関係しないのでモックに差し替える。
 */
jest.mock("@/components/pages/HomePageView/HomePageView", () => ({ HomePageView: () => null }));
jest.mock("@/components/pages/CreatePageView/CreatePageView", () => ({ CreatePageView: () => null }));
jest.mock("@/components/pages/GuideArticlePageView/GuideArticlePageView", () => ({
  GuideArticlePageView: () => null,
}));

import { metadata as jaHome } from "@/app/(ja)/page";
import { metadata as enHome } from "@/app/en/page";
import { metadata as jaCreate } from "@/app/(ja)/(tool)/create/page";
import { metadata as enCreate } from "@/app/en/(tool)/create/page";
import { generateMetadata as jaGuideMetadata } from "@/app/(ja)/(marketing)/guide/[slug]/page";
import { generateMetadata as enGuideMetadata } from "@/app/en/(marketing)/guide/[slug]/page";
import { metadata as jaFaq } from "@/app/(ja)/(marketing)/faq/page";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

const guideParams = (slug: string) => ({ params: Promise.resolve({ slug }) });

async function loadPairs(): Promise<
  { name: string; ja: Metadata; en: Metadata; expected: { ja: string; en: string } }[]
> {
  return [
    {
      name: "home",
      ja: jaHome,
      en: enHome,
      expected: { ja: `${SITE_URL}/`, en: `${SITE_URL}/en` },
    },
    {
      name: "create",
      ja: jaCreate,
      en: enCreate,
      expected: { ja: `${SITE_URL}/create`, en: `${SITE_URL}/en/create` },
    },
    {
      name: "getting-started",
      ja: await jaGuideMetadata(guideParams("getting-started")),
      en: await enGuideMetadata(guideParams("getting-started")),
      expected: {
        ja: `${SITE_URL}/guide/getting-started`,
        en: `${SITE_URL}/en/guide/getting-started`,
      },
    },
  ];
}

describe("3 組 6 ページの hreflang 相互参照", () => {
  // 意図: 各組の ja / en が同じ 3 URL（ja / en / x-default=ja）を出す
  it("各ページの languages が組ごとに同じ 3 URL", async () => {
    const pairs = await loadPairs();
    for (const { name, ja, en, expected } of pairs) {
      const want = { ja: expected.ja, en: expected.en, "x-default": expected.ja };
      expect({ name, lang: "ja", languages: ja.alternates?.languages }).toEqual({ name, lang: "ja", languages: want });
      expect({ name, lang: "en", languages: en.alternates?.languages }).toEqual({ name, lang: "en", languages: want });
    }
  });

  // 意図: 自己参照。各ページの canonical が languages の自分の言語の値と一致する
  it("各ページの canonical が languages に含まれ、自分の言語の値と一致する", async () => {
    const pairs = await loadPairs();
    for (const { name, ja, en, expected } of pairs) {
      const jaLangs = ja.alternates?.languages as Record<string, string>;
      const enLangs = en.alternates?.languages as Record<string, string>;
      expect({ name, canonical: ja.alternates?.canonical }).toEqual({ name, canonical: expected.ja });
      expect({ name, canonical: en.alternates?.canonical }).toEqual({ name, canonical: expected.en });
      expect(jaLangs.ja).toBe(ja.alternates?.canonical);
      expect(enLangs.en).toBe(en.alternates?.canonical);
      expect(Object.values(jaLangs)).toContain(ja.alternates?.canonical);
      expect(Object.values(enLangs)).toContain(en.alternates?.canonical);
    }
  });

  // 意図: og:locale と og:locale:alternate が言語ごとに逆になる
  it("ja は og ja_JP + alternate en_US、en は en_US + alternate ja_JP", async () => {
    const pairs = await loadPairs();
    for (const { ja, en } of pairs) {
      expect(ja.openGraph).toMatchObject({ locale: "ja_JP", alternateLocale: ["en_US"] });
      expect(en.openGraph).toMatchObject({ locale: "en_US", alternateLocale: ["ja_JP"] });
    }
  });
});

describe("英語版の無い ja ページには hreflang が無い", () => {
  // 意図: /faq（metadata export）は languages も alternateLocale も出さない
  it("/faq", () => {
    expect(jaFaq.alternates).not.toHaveProperty("languages");
    expect(jaFaq.openGraph).not.toHaveProperty("alternateLocale");
    expect(jaFaq.alternates?.canonical).toBe(`${SITE_URL}/faq`);
  });

  // 意図: ja にしかないガイド（generateMetadata）も languages を出さない
  it("/guide/utm-setup", async () => {
    const meta = await jaGuideMetadata(guideParams("utm-setup"));
    // 空振り防止: ページ自体の metadata は出ている
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/guide/utm-setup`);
    expect(meta.alternates).not.toHaveProperty("languages");
    expect(meta.openGraph).not.toHaveProperty("alternateLocale");
  });
});
