import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { GuideContent, GuideFrontmatter } from "@/types/content";

const CONTENT_DIR = path.join(process.cwd(), "src/content/guide");

export function getGuide(slug: string): GuideContent | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const fileContents = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContents);
  const frontmatter = data as GuideFrontmatter;
  return {
    slug,
    title: frontmatter.title,
    description: frontmatter.description,
    date: frontmatter.date,
    order: frontmatter.order,
    content,
  };
}

export function getGuideSlugList(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}
