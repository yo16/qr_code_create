import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";
import { buildMetadata } from "@/lib/metadata/buildMetadata";
import { GuideArticlePageView } from "@/components/pages/GuideArticlePageView/GuideArticlePageView";

export const dynamicParams = false;

interface EnGuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getGuideSlugList("en").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: EnGuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug, "en");
  if (!guide) return {};
  return buildMetadata(
    {
      title: guide.title,
      description: guide.description,
      path: `/en/guide/${slug}`,
    },
    "en"
  );
}

export default async function EnGuidePage({ params }: EnGuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug, "en");
  if (!guide) notFound();
  return <GuideArticlePageView locale="en" slug={slug} guide={guide} />;
}
