import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumb } from "@/components/layout/Breadcrumb/Breadcrumb";
import { ArticleCta } from "@/components/marketing/ArticleCta/ArticleCta";
import { buildBlogPostingSchema, buildBreadcrumbSchema, buildHowToSchema } from "@/lib/schema/buildJsonLd";
import { getDict } from "@/i18n/getDict";
import type { Locale } from "@/i18n/types";
import type { GuideContent } from "@/types/content";
import styles from "./guide.module.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

interface GuideArticlePageViewProps {
  locale: Locale;
  slug: string;
  guide: GuideContent;
}

export function GuideArticlePageView({ locale, slug, guide }: GuideArticlePageViewProps) {
  const { breadcrumb } = getDict(locale).guide;
  const isEn = locale === "en";
  const prefix = isEn ? "/en" : "";

  const blogSchema = buildBlogPostingSchema(
    {
      title: guide.title,
      description: guide.description,
      slug,
      datePublished: guide.date,
      ...(isEn ? { basePath: "/en/guide" } : {}),
    },
    locale
  );

  // ja は ホーム › 使い方ガイド › 記事、en は /en/guide 一覧が無いので Home › 記事
  const breadcrumbSchema = buildBreadcrumbSchema(
    isEn
      ? [
          { name: breadcrumb.home, url: `${SITE_URL}/en` },
          { name: guide.title, url: `${SITE_URL}/en/guide/${slug}` },
        ]
      : [
          { name: breadcrumb.home, url: `${SITE_URL}/` },
          { name: breadcrumb.guide, url: `${SITE_URL}/guide` },
          { name: guide.title, url: `${SITE_URL}/guide/${slug}` },
        ],
    locale
  );

  const breadcrumbItems = isEn
    ? [{ label: guide.title }]
    : [{ label: breadcrumb.guide, href: "/guide" }, { label: guide.title }];

  return (
    <article className={styles.article}>
      <JsonLd data={blogSchema} />
      <JsonLd data={breadcrumbSchema} />
      {guide.howto && guide.howto.length > 0 && (
        <JsonLd
          data={buildHowToSchema(
            {
              name: guide.title,
              description: guide.description,
              steps: guide.howto.map((step, i) => ({
                ...step,
                url: `${SITE_URL}${prefix}/guide/${slug}#step-${i + 1}`,
              })),
            },
            locale
          )}
        />
      )}
      <Breadcrumb items={breadcrumbItems} locale={locale} />
      <header className={styles.header}>
        <h1 className={styles.title}>{guide.title}</h1>
        <p className={styles.date}>{guide.date}</p>
      </header>
      <div className={styles.content}>
        <MDXRemote source={guide.content} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
      </div>
      <ArticleCta href={`${prefix}/create`} />
    </article>
  );
}
