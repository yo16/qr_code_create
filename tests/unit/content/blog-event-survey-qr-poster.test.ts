/**
 * @jest-environment node
 */
// ブログ記事「イベントのアンケートQRコードを、A4 1枚から4枚印刷して配る方法」(qr_code_create-bih)
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import sitemap from "@/app/sitemap";
import { getBlog, getBlogSlugList } from "@/lib/content/getBlog";
import { getAllBlogs } from "@/lib/content/getAllBlogs";

const SLUG = "event-survey-qr-poster";
const BLOG_DIR = path.join(process.cwd(), "src/content/blog");
const MDX_PATH = path.join(BLOG_DIR, `${SLUG}.mdx`);
const NL = String.fromCharCode(10);

const parsed = matter(fs.readFileSync(MDX_PATH, "utf-8"));
const data = parsed.data as Record<string, unknown>;
const body = parsed.content;

const extractLinks = (text: string): string[] => Array.from(text.matchAll(/\]\((\/[^)\s]*)/g), (m) => m[1]);
const toPath = (href: string): string => {
  const p = href.split(/[?#]/)[0];
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
};
const h2s = body
  .split(NL)
  .filter((l) => l.startsWith("## "))
  .map((l) => l.slice(3).trim());

describe("記事 event-survey-qr-poster: frontmatter", () => {
  it("title は非空で、サイト名「QR Code Create」を含まないこと（template が 1 回付ける）", () => {
    expect(typeof data.title).toBe("string");
    expect((data.title as string).length).toBeGreaterThan(0);
    expect(data.title as string).not.toContain("QR Code Create");
  });

  it("description が非空の文字列であること", () => {
    expect(typeof data.description).toBe("string");
    expect((data.description as string).length).toBeGreaterThan(0);
  });

  it("date が YYYY-MM-DD 形式の実在する日付であること", () => {
    expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(new Date(data.date as string).getTime())).toBe(false);
  });

  it("category が既存のブログと同じ値（qr-marketing）であること", () => {
    expect(data.category).toBe("qr-marketing");
    const existing = fs
      .readdirSync(BLOG_DIR)
      .filter((f) => f.endsWith(".mdx") && f !== `${SLUG}.mdx`)
      .map((f) => matter(fs.readFileSync(path.join(BLOG_DIR, f), "utf-8")).data.category);
    expect(existing).toContain(data.category);
  });
});

describe("記事 event-survey-qr-poster: 構成とリンク", () => {
  it("h2 の構成が想定どおりで、重複がないこと", () => {
    expect(h2s).toEqual([
      "QRコードを置くときの困りごと",
      "印刷用ポスターで4枚を一度に作る",
      "作る流れ",
      "活用シーン",
      "説明文と装飾のコツ",
      "場所ごとの計測",
      "まとめ",
    ]);
  });

  it("/poster へのリンクが 2 か所（本文とまとめ）あること", () => {
    const posterLinks = extractLinks(body).filter((h) => toPath(h) === "/poster");
    expect(posterLinks).toHaveLength(2);
    const summary = body.slice(body.indexOf("## まとめ"));
    expect(summary).toContain("](/poster)");
  });

  it.each(["/create", "/guide/download-formats", "/use-cases/event", "/use-cases/flyer"])(
    "%s へのリンクがあること",
    (href) => {
      expect(extractLinks(body).map(toPath)).toContain(href);
    }
  );

  it("導線ボタンの文言「印刷用ポスターを作る →」が jaClient の posterCta と一致すること", () => {
    const { jaClient } = jest.requireActual("@/i18n/jaClient") as {
      jaClient: { tool: { download: { posterCta: string } } };
    };
    expect(body).toContain(`「${jaClient.tool.download.posterCta}」`);
  });

  it("カードの大きさ「105mm × 148.5mm」が書かれていること", () => {
    expect(body).toContain("105mm × 148.5mm");
  });
});

describe("記事 event-survey-qr-poster: 一覧とサイトマップ", () => {
  it("getBlog で取得でき、スラッグ一覧に含まれること", () => {
    expect(getBlogSlugList()).toContain(SLUG);
    expect(getBlog(SLUG)?.title).toBe(data.title);
  });

  // 「先頭に来る」は次の記事を足すと崩れるので、含まれることと並び順だけを確かめる
  it("getAllBlogs に含まれ、一覧が日付の新しい順に並ぶこと", () => {
    const all = getAllBlogs();
    expect(all.map((b) => b.slug)).toContain(SLUG);
    const dates = all.map((b) => b.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("sitemap に /blog/event-survey-qr-poster が含まれること", () => {
    const paths = sitemap().map((e) => new URL(e.url).pathname);
    expect(paths).toContain(`/blog/${SLUG}`);
  });
});

describe("blog MDX の内部リンク", () => {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));
  const known = new Set(sitemap().map((e) => new URL(e.url).pathname));
  const links = files.flatMap((file) =>
    extractLinks(fs.readFileSync(path.join(BLOG_DIR, file), "utf8")).map((href) => ({ file, href }))
  );

  it("前提: blog の MDX が見つかり、sitemap に /poster・/create・/use-cases/event・/guide/download-formats が含まれること", () => {
    expect(files).toContain(`${SLUG}.mdx`);
    for (const p of ["/poster", "/create", "/use-cases/event", "/use-cases/flyer", "/guide/download-formats"]) {
      expect(known.has(p)).toBe(true);
    }
  });

  it("新記事から /poster へのリンクが抽出されること（検査が空振りしない）", () => {
    expect(links.some((l) => l.file === `${SLUG}.mdx` && toPath(l.href) === "/poster")).toBe(true);
  });

  it.each(links.map((l) => [`${l.file}: ${l.href}`, l.href]))("%s が sitemap のパスを指すこと", (_label, href) => {
    expect(known.has(toPath(href))).toBe(true);
  });
});
