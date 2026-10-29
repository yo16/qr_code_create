import type { MetadataRoute } from "next";
import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";
import { PAGE_METADATA } from "@/lib/metadata/buildMetadata";
import { getUseCase, getUseCaseSlugList } from "@/lib/content/getUseCase";
import { getBlog, getBlogSlugList } from "@/lib/content/getBlog";
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

// noindex のページ（PAGE_METADATA の noIndex）は sitemap に載せない
const NOINDEX_PATHS: ReadonlySet<string> = new Set(
  Object.values(PAGE_METADATA)
    .filter((page) => "noIndex" in page && page.noIndex === true)
    .map((page) => page.path),
);

// 記事の lastModified は updated、無ければ date。new Date() は使わない（呼ぶたびに値が変わるため）
// TODO(cwq): frontmatter に updated を足し、取得関数が updated を返すようにすれば、ここで自動的に拾われる
function lastModifiedOf(content: { date: string; updated?: string } | null): { lastModified?: string } {
  const value = content?.updated ?? content?.date;
  return value ? { lastModified: value } : {};
}

export default function sitemap(): MetadataRoute.Sitemap {
  // /poster は機能フラグが true のときだけ載せる
  const posterPages: MetadataRoute.Sitemap = FEATURE_FLAGS.posterPage
    ? [{ url: `${SITE_URL}/poster`, changeFrequency: "monthly", priority: 0.8 }]
    : [];

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}`, changeFrequency: "weekly", priority: 1.0, ...alternatesOf("/") },
    { url: `${SITE_URL}/create`, changeFrequency: "monthly", priority: 0.9, ...alternatesOf("/create") },
    ...posterPages,
    { url: `${SITE_URL}/guide`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/use-cases`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const guideSlugs = getGuideSlugList();
  const guidePages: MetadataRoute.Sitemap = guideSlugs.map((slug) => ({
    url: `${SITE_URL}/guide/${slug}`,
    ...lastModifiedOf(getGuide(slug)),
    changeFrequency: "monthly" as const,
    priority: 0.7,
    ...alternatesOf(`/guide/${slug}`),
  }));

  // ja 以外の言語。priority は全言語共通（トップ 0.8、create 0.7、ガイド 0.6）
  const localePages: MetadataRoute.Sitemap = NON_JA_LOCALES.flatMap((locale) => [
    { url: `${SITE_URL}${localePath(locale, "/")}`, changeFrequency: "weekly" as const, priority: 0.8, ...alternatesOf("/") },
    { url: `${SITE_URL}${localePath(locale, "/create")}`, changeFrequency: "monthly" as const, priority: 0.7, ...alternatesOf("/create") },
    ...getGuideSlugList(locale).map((slug) => ({
      url: `${SITE_URL}${localePath(locale, `/guide/${slug}`)}`,
      ...lastModifiedOf(getGuide(slug, locale)),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      ...alternatesOf(`/guide/${slug}`),
    })),
  ]);

  const useCaseSlugs = getUseCaseSlugList();
  const useCasePages: MetadataRoute.Sitemap = useCaseSlugs.map((slug) => ({
    url: `${SITE_URL}/use-cases/${slug}`,
    ...lastModifiedOf(getUseCase(slug)),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const blogSlugs = getBlogSlugList();
  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    ...lastModifiedOf(getBlog(slug)),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // ja トップの url は末尾スラッシュなし（SITE_URL そのもの）なので、path は "/" に直してから比べる
  const isIndexed = (entry: { url: string }) => !NOINDEX_PATHS.has(entry.url.slice(SITE_URL.length) || "/");

  return [...staticPages, ...guidePages, ...useCasePages, ...blogPages, ...localePages].filter(isIndexed);
}
