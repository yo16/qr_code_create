import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getBlog, getBlogSlugList } from "@/lib/content/getBlog";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumb } from "@/components/layout/Breadcrumb/Breadcrumb";
import { buildMetadata } from "@/lib/metadata/buildMetadata";
import { buildBlogPostingSchema, buildBreadcrumbSchema } from "@/lib/schema/buildJsonLd";
import styles from "./blog.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.qr-create.jp";

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getBlogSlugList().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = getBlog(slug);
  if (!blog) return {};
  return buildMetadata({
    title: blog.title,
    description: blog.description,
    path: `/blog/${slug}`,
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const blog = getBlog(slug);
  if (!blog) notFound();

  const articleSchema = buildBlogPostingSchema({
    title: blog.title,
    description: blog.description,
    slug,
    datePublished: blog.date,
    basePath: "/blog",
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "ホーム", url: `${SITE_URL}/` },
    { name: "ブログ", url: `${SITE_URL}/blog` },
    { name: blog.title, url: `${SITE_URL}/blog/${slug}` },
  ]);

  return (
    <article className={styles.article}>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Breadcrumb
        items={[
          { label: "ブログ", href: "/blog" },
          { label: blog.title },
        ]}
      />
      <header className={styles.header}>
        <h1 className={styles.title}>{blog.title}</h1>
        <div className={styles.meta}>
          <time className={styles.date}>{blog.date}</time>
          {blog.category && (
            <span className={styles.category}>{blog.category}</span>
          )}
        </div>
      </header>
      <div className={styles.content}>
        <MDXRemote source={blog.content} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
      </div>
    </article>
  );
}
