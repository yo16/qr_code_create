/**
 * @jest-environment node
 */
// HowTo の JSON-LD の url（#step-N）と、ガイド本文の見出しの id が対応していること（qr_code_create-kg5）。
// GuideArticlePageView は howto の i 番目に `#step-${i + 1}` を付ける。本文の「ステップN / Step N」の見出しが同じ番号で並ぶ必要がある。
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getStepHeadingId } from "@/lib/content/stepHeading";

const NL = String.fromCharCode(10);

describe.each([
  ["ja", "src/content/guide/getting-started.mdx"],
  ["en", "src/content/en/guide/getting-started.mdx"],
  ["es", "src/content/es/guide/getting-started.mdx"],
  ["pt-br", "src/content/pt-br/guide/getting-started.mdx"],
  ["de", "src/content/de/guide/getting-started.mdx"],
])("%s の getting-started", (_locale, rel) => {
  const parsed = matter(fs.readFileSync(path.join(process.cwd(), rel), "utf-8"));
  const howto = (parsed.data.howto ?? []) as { name: string }[];
  const stepIds = parsed.content
    .split(NL)
    .filter((l) => l.startsWith("## "))
    .map((l) => getStepHeadingId(l.slice(3)))
    .filter((id): id is string => id !== undefined);

  it("frontmatter の howto が 1 件以上あること（検査が空振りしない）", () => {
    expect(howto.length).toBeGreaterThan(0);
  });

  it("howto の件数と、本文の「ステップN / Step N」の見出しの数が一致すること", () => {
    expect(stepIds).toHaveLength(howto.length);
  });

  it("見出しの id が step-1, step-2, ... の連番で、howto の i 番目の url（#step-(i+1)）と対応すること", () => {
    expect(stepIds).toEqual(howto.map((_, i) => `step-${i + 1}`));
  });
});
