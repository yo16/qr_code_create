/**
 * @jest-environment node
 */
// qr_code_create-fyt: 用途別ページ 4 件（event / flyer / signage / poster）に追記した「印刷用ポスター」の節と、
// use-cases 全 MDX の内部リンク（sitemap のパスを指すこと）を検査する。
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import sitemap from "@/app/sitemap";

const DIR = path.join(process.cwd(), "src/content/use-cases");

const CASES = [
  { slug: "event", heading: "## 印刷用ポスターPDFですぐ印刷", utmNote: true },
  { slug: "flyer", heading: "## カード型の配布物として", utmNote: false },
  { slug: "signage", heading: "## 看板と手元の配布物を組み合わせる", utmNote: false },
  { slug: "poster", heading: "## 複数の場所に同じQRを掲示する", utmNote: true },
] as const;

const NL = String.fromCharCode(10);

function readBody(slug: string): string {
  return matter(fs.readFileSync(path.join(DIR, `${slug}.mdx`), "utf-8")).content;
}

function sectionOf(body: string, heading: string): string {
  const start = body.indexOf(heading);
  if (start === -1) return "";
  const rest = body.slice(start + heading.length);
  const next = rest.indexOf(NL + "## ");
  return next === -1 ? rest : rest.slice(0, next);
}

function countOf(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

describe.each(CASES)("$slug.mdx の印刷用ポスターの節", ({ slug, heading, utmNote }) => {
  const body = readBody(slug);
  const section = sectionOf(body, heading);

  it(`「${heading}」の節があり、h2 として 1 回だけ現れること`, () => {
    expect(countOf(body, NL + heading)).toBe(1);
    expect(section.length).toBeGreaterThan(0);
  });

  it("節の中に /poster への直リンク、/create への導線、/guide/download-formats へのリンクが 1 回ずつあること", () => {
    expect(countOf(section, "](/poster)")).toBe(1);
    expect(countOf(section, "](/create)")).toBe(1);
    expect(countOf(section, "](/guide/download-formats)")).toBe(1);
  });

  it("導線ボタンの文言「印刷用ポスターを作る →」が書かれていること", () => {
    expect(section).toContain("「印刷用ポスターを作る →」");
  });

  it("カードの大きさ 105mm × 148.5mm（A4 の 4 分の 1）が書かれていること", () => {
    expect(section).toContain("105mm × 148.5mm");
  });

  if (utmNote) {
    it("4 枚は同じ URL（同じ utm_content）で、場所ごとに計測するなら PDF を別々に作る旨の 1 文があること", () => {
      expect(section).toContain("すべて同じURL（同じutm_content）");
      expect(section).toContain("PDFを別々に作りましょう");
    });
  }
});

describe("flyer.mdx のはがきとの比較", () => {
  it("はがき（100mm × 148mm）との比較が書かれていること", () => {
    const section = sectionOf(readBody("flyer"), "## カード型の配布物として");
    expect(section).toContain("はがき（100mm × 148mm）");
    expect(section).toContain("105mm × 148.5mm（A4の4分の1）");
  });
});

describe("poster.mdx の節の位置", () => {
  it("「推奨UTM設定」の後、「おすすめデザイン」の前にあること", () => {
    const body = readBody("poster");
    const utm = body.indexOf("## ポスター用QRコードの推奨UTM設定");
    const added = body.indexOf("## 複数の場所に同じQRを掲示する");
    const design = body.indexOf("## ポスター用QRコードのおすすめデザイン");
    expect(utm).toBeGreaterThanOrEqual(0);
    expect(added).toBeGreaterThan(utm);
    expect(design).toBeGreaterThan(added);
  });
});

describe("use-cases MDX の内部リンク", () => {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".mdx"));
  const extract = (text: string): string[] => Array.from(text.matchAll(/\]\((\/[^)\s]*)/g), (m) => m[1]);
  const toPath = (href: string): string => {
    const p = href.split(/[?#]/)[0];
    return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
  };
  const known = new Set(sitemap().map((entry) => new URL(entry.url).pathname));

  it("前提: sitemap に /poster、/create、/guide/download-formats が含まれ、use-cases の MDX が見つかること", () => {
    expect(known.has("/poster")).toBe(true);
    expect(known.has("/create")).toBe(true);
    expect(known.has("/guide/download-formats")).toBe(true);
    expect(files.length).toBeGreaterThan(0);
  });

  const links = files.flatMap((file) =>
    extract(fs.readFileSync(path.join(DIR, file), "utf8")).map((href) => ({ file, href }))
  );

  it("4 件の MDX から /poster へのリンクが抽出されること（検査が空振りしない）", () => {
    const withPoster = links.filter((l) => toPath(l.href) === "/poster").map((l) => l.file);
    for (const slug of ["event", "flyer", "signage", "poster"]) {
      expect(withPoster).toContain(`${slug}.mdx`);
    }
  });

  it.each(links.map((l) => [`${l.file}: ${l.href}`, l.href]))("%s が sitemap のパスを指すこと", (_label, href) => {
    expect(known.has(toPath(href))).toBe(true);
  });
});
