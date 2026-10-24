import type { MetadataRoute } from "next";
import { getGuideSlugList } from "@/lib/content/getGuide";
import { getUseCaseSlugList } from "@/lib/content/getUseCase";
import { getBlogSlugList } from "@/lib/content/getBlog";
import { hasEnVersion } from "@/lib/i18n/routes";
import { FEATURE_FLAGS } from "@/lib/constants/features";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

// 両言語が揃うページの hreflang（ja 側・en 側の両方のエントリに同じものを付ける）
function languagesFor(jaPath: string, enPath: string) {
  const ja = jaPath === "/" ? SITE_URL : `${SITE_URL}${jaPath}`;
  return { languages: { ja, en: `${SITE_URL}${enPath}`, "x-default": ja } };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0, alternates: languagesFor("/", "/en") },
    { url: `${SITE_URL}/create`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9, alternates: languagesFor("/create", "/en/create") },
    ...(FEATURE_FLAGS.posterPage
      ? [{ url: `${SITE_URL}/poster`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 }]
      : []),
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
    ...(hasEnVersion(`/guide/${slug}`)
      ? { alternates: languagesFor(`/guide/${slug}`, `/en/guide/${slug}`) }
      : {}),
  }));

  const enPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/en`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8, alternates: languagesFor("/", "/en") },
    { url: `${SITE_URL}/en/create`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7, alternates: languagesFor("/create", "/en/create") },
    ...getGuideSlugList("en").map((slug) => ({
      url: `${SITE_URL}/en/guide/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      ...(hasEnVersion(`/guide/${slug}`)
        ? { alternates: languagesFor(`/guide/${slug}`, `/en/guide/${slug}`) }
        : {}),
    })),
  ];

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

  return [...staticPages, ...guidePages, ...useCasePages, ...blogPages, ...enPages];
}
