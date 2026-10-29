/**
 * @jest-environment node
 */
// 取得関数を経由しない実データの検査: frontmatter を fs と gray-matter で直接読み、取得関数の結果と照合する
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";
import { getUseCase, getUseCaseSlugList } from "@/lib/content/getUseCase";
import { getBlog, getBlogSlugList } from "@/lib/content/getBlog";
import { LOCALES, NON_JA_LOCALES } from "@/i18n/locales";
import type { Locale } from "@/i18n/types";

const CONTENT = path.join(process.cwd(), "src", "content");

function rawFrontmatter(...segments: string[]): Record<string, unknown> {
  const file = path.join(CONTENT, ...segments);
  return matter(fs.readFileSync(file, "utf-8")).data;
}

/** 生の frontmatter 値を、期待値として YYYY-MM-DD に直す（実装に依存しない書き方） */
function expectedDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === "string" ? value : undefined;
}

const guideDir = (l: Locale) => (l === "ja" ? ["guide"] : [l, "guide"]);

describe("getting-started の updated（実ファイル）", () => {
  it.each(NON_JA_LOCALES)("%s は updated が 2026-10-28 であること", (l) => {
    const guide = getGuide("getting-started", l);
    expect(guide?.updated).toBe("2026-10-28");
  });

  it("ja は updated が無く、date が 2026-04-17 であること", () => {
    const guide = getGuide("getting-started", "ja");
    expect(guide?.updated).toBeUndefined();
    expect(guide?.date).toBe("2026-04-17");
  });
});

describe("ガイド: 取得関数の値が生の frontmatter と一致すること", () => {
  it.each(LOCALES)("%s の全ガイドで date と updated が一致すること", (l) => {
    const slugs = getGuideSlugList(l);
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      const raw = rawFrontmatter(...guideDir(l), `${slug}.mdx`);
      const guide = getGuide(slug, l);
      expect({ l, slug, date: guide?.date, updated: guide?.updated }).toEqual({
        l,
        slug,
        date: expectedDate(raw.date),
        updated: expectedDate(raw.updated),
      });
    }
  });

  it("updated を持つガイドは 4 言語の getting-started だけであること", () => {
    const withUpdated = LOCALES.flatMap((l) =>
      getGuideSlugList(l)
        .filter((slug) => getGuide(slug, l)?.updated !== undefined)
        .map((slug) => `${l}/${slug}`)
    );
    expect(withUpdated.sort()).toEqual(NON_JA_LOCALES.map((l) => `${l}/getting-started`).sort());
  });
});

describe("use-cases と blog: 取得関数の値が生の frontmatter と一致し、updated は無いこと", () => {
  it("use-cases", () => {
    const slugs = getUseCaseSlugList();
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      const raw = rawFrontmatter("use-cases", `${slug}.mdx`);
      const uc = getUseCase(slug);
      expect({ slug, date: uc?.date, updated: uc?.updated }).toEqual({
        slug,
        date: expectedDate(raw.date),
        updated: expectedDate(raw.updated),
      });
      expect(uc?.updated).toBeUndefined();
    }
  });

  it("blog", () => {
    const slugs = getBlogSlugList();
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      const raw = rawFrontmatter("blog", `${slug}.mdx`);
      const blog = getBlog(slug);
      expect({ slug, date: blog?.date, updated: blog?.updated }).toEqual({
        slug,
        date: expectedDate(raw.date),
        updated: expectedDate(raw.updated),
      });
      expect(blog?.updated).toBeUndefined();
    }
  });

  it("date は YYYY-MM-DD の文字列であること", () => {
    for (const slug of getBlogSlugList()) expect(getBlog(slug)?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const slug of getUseCaseSlugList()) expect(getUseCase(slug)?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
