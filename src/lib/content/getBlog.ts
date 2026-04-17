import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogContent, BlogFrontmatter } from "@/types/content";

const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

export function getBlog(slug: string): BlogContent | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const fileContents = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContents);
  const frontmatter = data as BlogFrontmatter;
  return {
    slug,
    title: frontmatter.title,
    description: frontmatter.description,
    date: frontmatter.date,
    category: frontmatter.category,
    content,
  };
}

export function getBlogSlugList(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}
