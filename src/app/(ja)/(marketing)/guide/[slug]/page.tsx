import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";
import { buildMetadata, getGuideAlternatePaths } from "@/lib/metadata/buildMetadata";
import { GuideArticlePageView } from "@/components/pages/GuideArticlePageView/GuideArticlePageView";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getGuideSlugList().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return buildMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guide/${slug}`,
    alternatePaths: getGuideAlternatePaths(slug),
  });
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  return <GuideArticlePageView locale="ja" slug={slug} guide={guide} />;
}
