/**
 * @jest-environment node
 */
// ja ガイド MDX 内リンクの規則（enGuideLinks.test.ts と同じ考え方）。
// 内部リンク（/ で始まるもの）の行き先が、sitemap に載っているパス（＝実在するページ）であること。
import fs from "fs";
import path from "path";
import sitemap from "@/app/sitemap";

const GUIDE_DIR = path.join(process.cwd(), "src/content/guide");
const files = fs.readdirSync(GUIDE_DIR).filter((f) => f.endsWith(".mdx"));

/** `](/...)` 形式の内部リンクの行き先を抽出する（title は除く） */
const extractInternalLinks = (text: string): string[] =>
  Array.from(text.matchAll(/\]\((\/[^)\s]*)/g), (m) => m[1]);

const toPath = (href: string): string => {
  const p = href.split(/[?#]/)[0];
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
};

const knownPaths = new Set(sitemap().map((entry) => new URL(entry.url).pathname));

describe("ja ガイド MDX の内部リンク", () => {
  it("抽出関数は内部リンクだけを拾い、外部 URL とアンカーは拾わないこと", () => {
    const sample = "[a](/create) [b](https://example.com) [c](#x) [d](/poster?x=1 \"t\")";
    expect(extractInternalLinks(sample)).toEqual(["/create", "/poster?x=1"]);
  });

  it("src/content/guide に MDX が 1 件以上あり、download-formats.mdx が含まれること", () => {
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain("download-formats.mdx");
  });

  it("sitemap に /poster と /create が含まれること（検査が空振りしない）", () => {
    expect(knownPaths.has("/poster")).toBe(true);
    expect(knownPaths.has("/create")).toBe(true);
  });

  const links = files.flatMap((file) =>
    extractInternalLinks(fs.readFileSync(path.join(GUIDE_DIR, file), "utf8")).map((href) => ({
      file,
      href,
    }))
  );

  it("download-formats.mdx から /poster へのリンクが抽出されること", () => {
    expect(links.some((l) => l.file === "download-formats.mdx" && toPath(l.href) === "/poster")).toBe(true);
  });

  it.each(links.map((l) => [`${l.file}: ${l.href}`, l.href]))(
    "%s が sitemap のパスを指すこと",
    (_label, href) => {
      expect(knownPaths.has(toPath(href))).toBe(true);
    }
  );
});
