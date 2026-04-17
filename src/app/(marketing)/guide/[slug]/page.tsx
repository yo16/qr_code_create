import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumb } from "@/components/layout/Breadcrumb/Breadcrumb";
import { buildMetadata } from "@/lib/metadata/buildMetadata";
import { buildBlogPostingSchema, buildBreadcrumbSchema } from "@/lib/schema/buildJsonLd";
import styles from "./guide.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.qr-create.jp";

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
  });
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const blogSchema = buildBlogPostingSchema({
    title: guide.title,
    description: guide.description,
    slug,
    datePublished: guide.date,
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "ホーム", url: `${SITE_URL}/` },
    { name: "使い方ガイド", url: `${SITE_URL}/guide` },
    { name: guide.title, url: `${SITE_URL}/guide/${slug}` },
  ]);

  return (
    <article className={styles.article}>
      <JsonLd data={blogSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Breadcrumb
        items={[
          { label: "使い方ガイド", href: "/guide" },
          { label: guide.title },
        ]}
      />
      <header className={styles.header}>
        <h1 className={styles.title}>{guide.title}</h1>
        <p className={styles.date}>{guide.date}</p>
      </header>
      <div className={styles.content}>
        <MDXRemote source={guide.content} />
      </div>
    </article>
  );
}
