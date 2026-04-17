import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getUseCase, getUseCaseSlugList } from "@/lib/content/getUseCase";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumb } from "@/components/layout/Breadcrumb/Breadcrumb";
import { buildMetadata } from "@/lib/metadata/buildMetadata";
import { buildBlogPostingSchema, buildBreadcrumbSchema } from "@/lib/schema/buildJsonLd";
import styles from "./use-case.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.qr-create.jp";

interface UseCasePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getUseCaseSlugList().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: UseCasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const useCase = getUseCase(slug);
  if (!useCase) return {};
  return buildMetadata({
    title: useCase.title,
    description: useCase.description,
    path: `/use-cases/${slug}`,
  });
}

export default async function UseCasePage({ params }: UseCasePageProps) {
  const { slug } = await params;
  const useCase = getUseCase(slug);
  if (!useCase) notFound();

  const articleSchema = buildBlogPostingSchema({
    title: useCase.title,
    description: useCase.description,
    slug,
    datePublished: useCase.date,
    basePath: "/use-cases",
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "ホーム", url: `${SITE_URL}/` },
    { name: "用途別QRコード", url: `${SITE_URL}/use-cases` },
    { name: useCase.title, url: `${SITE_URL}/use-cases/${slug}` },
  ]);

  return (
    <article className={styles.article}>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Breadcrumb
        items={[
          { label: "用途別QRコード", href: "/use-cases" },
          { label: useCase.title },
        ]}
      />
      <header className={styles.header}>
        <h1 className={styles.title}>{useCase.title}</h1>
        <p className={styles.date}>{useCase.date}</p>
      </header>
      <div className={styles.content}>
        <MDXRemote source={useCase.content} />
      </div>
    </article>
  );
}
