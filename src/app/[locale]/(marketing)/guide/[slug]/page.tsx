import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isNonJaLocale } from "@/i18n/locales";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";
import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";
import { resolveLocale, type LocaleParams } from "@/lib/i18n/params";
import { buildMetadata, getGuideAlternatePaths } from "@/lib/metadata/buildMetadata";
import { GuideArticlePageView } from "@/components/pages/GuideArticlePageView/GuideArticlePageView";

export const dynamicParams = false;

interface LocaleGuidePageProps {
  params: Promise<LocaleParams & { slug: string }>;
}

// 親の [locale] の generateStaticParams と組み合わせて、locale ごとの slug を返す
export async function generateStaticParams({ params }: { params: LocaleParams }) {
  if (!isNonJaLocale(params.locale)) return [];
  return getGuideSlugList(params.locale).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: LocaleGuidePageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const guide = getGuide(slug, locale);
  if (!guide) return {};
  return buildMetadata(
    {
      title: guide.title,
      description: guide.description,
      path: `${LOCALE_CONFIG[locale].prefix}/guide/${slug}`,
      alternatePaths: getGuideAlternatePaths(slug),
    },
    locale
  );
}

export default async function LocaleGuidePage({ params }: LocaleGuidePageProps) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const guide = getGuide(slug, locale);
  if (!guide) notFound();
  return <GuideArticlePageView locale={locale} slug={slug} guide={guide} />;
}
