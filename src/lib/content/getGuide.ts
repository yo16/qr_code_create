import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { GuideContent, GuideFrontmatter } from "@/types/content";
import type { Locale } from "@/i18n/types";
import { isValidSlug } from "./isValidSlug";
import { requireIsoDate, toIsoDate } from "./toIsoDate";

/** ja → src/content/guide、ほか → src/content/{locale}/guide */
function contentDir(locale: Locale): string {
  return locale === "ja"
    ? path.join(process.cwd(), "src/content/guide")
    : path.join(process.cwd(), "src/content", locale, "guide");
}

export function getGuide(slug: string, locale: Locale = "ja"): GuideContent | null {
  if (!isValidSlug(slug)) return null;
  const filePath = path.join(contentDir(locale), `${slug}.mdx`);
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
    date: requireIsoDate(frontmatter.date, filePath),
    updated: toIsoDate(frontmatter.updated),
    order: frontmatter.order,
    howto: frontmatter.howto,
    content,
  };
}

export function getGuideSlugList(locale: Locale = "ja"): string[] {
  const dir = contentDir(locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}
