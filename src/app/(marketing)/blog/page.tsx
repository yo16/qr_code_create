import type { Metadata } from "next";
import Link from "next/link";
import { getAllBlogs } from "@/lib/content/getAllBlogs";
import { Breadcrumb } from "@/components/layout/Breadcrumb/Breadcrumb";
import { buildMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";
import styles from "./blog-index.module.css";

export const metadata: Metadata = buildMetadata(PAGE_METADATA.blog);

export default function BlogIndexPage() {
  const blogs = getAllBlogs();

  return (
    <div className={styles.container}>
      <Breadcrumb items={[{ label: "ブログ" }]} />
      <header className={styles.header}>
        <h1 className={styles.title}>ブログ</h1>
        <p className={styles.description}>
          QRコードマーケティングやUTMパラメータの活用方法について、実践的な情報をお届けします。
        </p>
      </header>
      <div className={styles.list}>
        {blogs.map((blog) => (
          <Link key={blog.slug} href={`/blog/${blog.slug}`} className={styles.card}>
            <div className={styles.cardMeta}>
              <time className={styles.cardDate}>{blog.date}</time>
              {blog.category && (
                <span className={styles.cardCategory}>{blog.category}</span>
              )}
            </div>
            <p className={styles.cardTitle}>{blog.title}</p>
            <p className={styles.cardDescription}>{blog.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
