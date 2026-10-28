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
  it.each([...NON_JA_LOCALES])("locale=%s では getGuideSlugList(locale) を { slug } の配列で返し、1 件以上ある", async (locale) => {
    const result = await guideParams({ params: { locale } });
    const slugs = getGuideSlugList(locale);
    expect(slugs.length).toBeGreaterThan(0);
    expect(result).toEqual(slugs.map((slug) => ({ slug })));
  });

  it.each(["ja", "xx", "EN", ""])('locale="%s" では空配列', async (locale) => {
    await expect(guideParams({ params: { locale } })).resolves.toEqual([]);
  });
});
