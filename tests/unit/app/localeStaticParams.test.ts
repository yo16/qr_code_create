jest.mock("@/components/pages/GuideArticlePageView/GuideArticlePageView", () => ({
  GuideArticlePageView: () => null,
}));

import { NON_JA_LOCALES } from "@/i18n/locales";
import { getGuideSlugList } from "@/lib/content/getGuide";
import { generateStaticParams as layoutParams } from "@/app/[locale]/layout";
import { generateStaticParams as guideParams } from "@/app/[locale]/(marketing)/guide/[slug]/page";

describe("[locale] layout の generateStaticParams", () => {
  it("NON_JA_LOCALES を { locale } の配列で返す", () => {
    expect(layoutParams()).toEqual(NON_JA_LOCALES.map((locale) => ({ locale })));
  });

  it("ja を含まない", () => {
    expect(layoutParams().map((p) => p.locale)).not.toContain("ja");
  });
});

describe("[locale]/guide/[slug] の generateStaticParams", () => {
  it('locale="en" では getGuideSlugList("en") を { slug } の配列で返す', async () => {
    const result = await guideParams({ params: { locale: "en" } });
    const slugs = getGuideSlugList("en");
    expect(slugs.length).toBeGreaterThan(0);
    expect(result).toEqual(slugs.map((slug) => ({ slug })));
  });

  it.each(["ja", "xx", "EN", ""])('locale="%s" では空配列', async (locale) => {
    await expect(guideParams({ params: { locale } })).resolves.toEqual([]);
  });
});
