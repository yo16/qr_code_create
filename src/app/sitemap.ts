import type { MetadataRoute } from "next";
import { getGuideSlugList } from "@/lib/content/getGuide";
import { getUseCaseSlugList } from "@/lib/content/getUseCase";
import { getBlogSlugList } from "@/lib/content/getBlog";
import { NON_JA_LOCALES } from "@/i18n/locales";
import { localePath } from "@/lib/i18n/routes";
import { alternatesFor } from "@/lib/seo/alternates";
import { FEATURE_FLAGS } from "@/lib/constants/features";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

// 翻訳のあるページだけ hreflang を付ける（どの言語のエントリにも同じものを付ける）。ja トップの表記は loc に合わせて末尾スラッシュなし
function alternatesOf(jaPath: string) {
  const alternates = alternatesFor(jaPath, { bareRoot: true });
  return alternates ? { alternates } : {};
}

export default function sitemap(): MetadataRoute.Sitemap {
  // /poster は機能フラグが true のときだけ載せる
  const posterPages: MetadataRoute.Sitemap = FEATURE_FLAGS.posterPage
    ? [{ url: `${SITE_URL}/poster`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 }]
    : [];

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0, ...alternatesOf("/") },
    { url: `${SITE_URL}/create`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9, ...alternatesOf("/create") },
    ...posterPages,
    { url: `${SITE_URL}/guide`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/use-cases`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const guideSlugs = getGuideSlugList();
  const guidePages: MetadataRoute.Sitemap = guideSlugs.map((slug) => ({
    url: `${SITE_URL}/guide/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
    ...alternatesOf(`/guide/${slug}`),
  }));

  // ja 以外の言語。priority は全言語共通（トップ 0.8、create 0.7、ガイド 0.6）
  const localePages: MetadataRoute.Sitemap = NON_JA_LOCALES.flatMap((locale) => [
    { url: `${SITE_URL}${localePath(locale, "/")}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8, ...alternatesOf("/") },
    { url: `${SITE_URL}${localePath(locale, "/create")}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7, ...alternatesOf("/create") },
    ...getGuideSlugList(locale).map((slug) => ({
      url: `${SITE_URL}${localePath(locale, `/guide/${slug}`)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      ...alternatesOf(`/guide/${slug}`),
    })),
  ]);

  const useCaseSlugs = getUseCaseSlugList();
  const useCasePages: MetadataRoute.Sitemap = useCaseSlugs.map((slug) => ({
    url: `${SITE_URL}/use-cases/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const blogSlugs = getBlogSlugList();
  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...guidePages, ...useCasePages, ...blogPages, ...localePages];
}
