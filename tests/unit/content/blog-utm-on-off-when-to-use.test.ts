/**
 * @jest-environment node
 */
// ブログ記事「UTMパラメータをOFFにしたい場面と切り替え方法」(qr_code_create-33a)
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import sitemap from "@/app/sitemap";
import { getBlog, getBlogSlugList } from "@/lib/content/getBlog";
import { getAllBlogs } from "@/lib/content/getAllBlogs";

const SLUG = "utm-on-off-when-to-use";
const BLOG_DIR = path.join(process.cwd(), "src/content/blog");
const MDX_PATH = path.join(BLOG_DIR, `${SLUG}.mdx`);
const CSS_PATH = path.join(process.cwd(), "src/app/(ja)/(marketing)/blog/[slug]/blog.module.css");

const parsed = matter(fs.readFileSync(MDX_PATH, "utf-8"));
const data = parsed.data as Record<string, unknown>;
const body = parsed.content;

const extractLinks = (text: string): string[] => Array.from(text.matchAll(/\]\((\/[^)\s]*)/g), (m) => m[1]);
const toPath = (href: string): string => {
  const p = href.split(/[?#]/)[0];
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
};

describe("記事 utm-on-off-when-to-use: frontmatter", () => {
  it("title が非空で、サイト名「QR Code Create」を含まないこと", () => {
    expect(typeof data.title).toBe("string");
    expect((data.title as string).length).toBeGreaterThan(0);
    expect(data.title as string).not.toContain("QR Code Create");
  });

  it("description が非空の文字列であること", () => {
    expect(typeof data.description).toBe("string");
    expect((data.description as string).length).toBeGreaterThan(0);
  });

  it("date が 2026-10-26 であること", () => {
    expect(data.date).toBe("2026-10-26");
    expect(Number.isNaN(new Date(data.date as string).getTime())).toBe(false);
  });

  it("category が utm-tips であること", () => {
    expect(data.category).toBe("utm-tips");
  });
});

describe("記事 utm-on-off-when-to-use: 本文", () => {
  it.each(["UTMなし", "シンプル", "個人用", "社内利用"])("キーワード「%s」を含むこと", (kw) => {
    expect(body).toContain(kw);
  });

  it.each(["/create", "/guide/utm-setup", "/guide/utm-parameters"])("%s へのリンクがあること", (href) => {
    expect(extractLinks(body).map(toPath)).toContain(href);
  });

  it("ON の URL 例は utm_ を含み、OFF の URL 例は utm_ を含まないこと", () => {
    const rows = body.split("\n").filter((l) => l.startsWith("|"));
    const on = rows.find((l) => /^\|\s*ON\s*\|/.test(l));
    const off = rows.find((l) => /^\|\s*OFF\s*\|/.test(l));
    expect(on).toBeDefined();
    expect(off).toBeDefined();
    expect(on).toContain("utm_source=");
    expect(off).toContain("https://example.com/menu");
    expect(off).not.toContain("utm_");
  });

  it("事実: 初期状態は ON、OFF でも入力値が残る、ポスターへ引き継がれる", () => {
    expect(body).toContain("初期状態はON");
    expect(body).toContain("OFFにしても、入力済みのUTMの値は消えません");
    expect(body).toMatch(/\/poster.*OFFの状態が引き継がれます/);
  });

  it("削除した主張「計測データが混ざる」が無いこと", () => {
    expect(body).not.toContain("データが混ざ");
  });

  it("引用する UI 文言が jaClient の utm.title / utm.toggleLabel と一致すること", () => {
    const { jaClient } = jest.requireActual("@/i18n/jaClient") as {
      jaClient: { utm: { title: string; toggleLabel: string } };
    };
    expect(body).toContain(`「${jaClient.utm.title}」`);
    expect(body).toContain(`「${jaClient.utm.toggleLabel}」`);
  });

  it("生の ** が残っていないこと（太字が崩れていない）", () => {
    expect(body).not.toContain("**");
  });

  it("表（区切り行）が 1 つだけあること", () => {
    const seps = body.split("\n").filter((l) => /^\|\s*-{3,}/.test(l));
    expect(seps).toHaveLength(1);
  });

  it("h1 相当（# 見出し）が本文に無いこと（h1 は title が担う）", () => {
    expect(body.split("\n").some((l) => l.startsWith("# "))).toBe(false);
  });
});

describe("記事 utm-on-off-when-to-use: 一覧とサイトマップ", () => {
  it("getBlog で取得でき、スラッグ一覧に含まれること", () => {
    expect(getBlogSlugList()).toContain(SLUG);
    expect(getBlog(SLUG)?.title).toBe(data.title);
  });

  it("存在しない slug は getBlog が null を返し、スラッグ一覧にも無いこと（異常系）", () => {
    expect(getBlog("no-such-post")).toBeNull();
    expect(getBlogSlugList()).not.toContain("no-such-post");
  });

  it("getAllBlogs に含まれ、日付の新しい順に並ぶこと", () => {
    const all = getAllBlogs();
    expect(all.map((b) => b.slug)).toContain(SLUG);
    const dates = all.map((b) => b.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("sitemap に /blog/utm-on-off-when-to-use が含まれること", () => {
    const paths = sitemap().map((e) => new URL(e.url).pathname);
    expect(paths).toContain(`/blog/${SLUG}`);
  });

  it("本文の内部リンクがすべて sitemap のパスを指すこと", () => {
    const known = new Set(sitemap().map((e) => new URL(e.url).pathname));
    const links = extractLinks(body);
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const href of links) {
      expect(known.has(toPath(href))).toBe(true);
    }
  });
});

describe("blog.module.css: 長いインラインコードの折り返し", () => {
  const css = fs.readFileSync(CSS_PATH, "utf-8");
  const block = css.match(/\.content\s+:global\(code\)\s*\{([^}]*)\}/);

  it(".content :global(code) のルールがあること", () => {
    expect(block).not.toBeNull();
  });

  it("そのルールに overflow-wrap: anywhere; があること", () => {
    expect(block?.[1]).toMatch(/overflow-wrap:\s*anywhere\s*;/);
  });
});
