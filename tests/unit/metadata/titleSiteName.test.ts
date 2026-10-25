import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { ja } from "@/i18n/ja";
import { en } from "@/i18n/en";
import { buildMetadata } from "@/lib/metadata/buildMetadata";

// 規則（qr_code_create-176）: ページ側の title にサイト名「QR Code Create」を含めない。
// <title> はルートの template `%s | QR Code Create` で 1 回付く。例外はトップ（/ と /en）だけ。
const SITE_NAME = "QR Code Create";
const ROOT = process.cwd();

function listFiles(dir: string, ext: RegExp, name?: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, ext, name));
    else if (ext.test(entry.name) && (!name || entry.name === name)) out.push(full);
  }
  return out;
}

describe("辞書の metadata の title", () => {
  it.each([
    ["ja", ja.meta.pages],
    ["en", en.meta.pages],
  ] as const)("%s: トップ以外のページ title にサイト名を含まないこと", (_locale, pages) => {
    const entries = Object.entries(pages).filter(([key]) => key !== "home");
    expect(entries.length).toBeGreaterThan(0);
    for (const [key, page] of entries) {
      expect({ key, hasSiteName: (page as { title: string }).title.includes(SITE_NAME) }).toEqual({
        key,
        hasSiteName: false,
      });
    }
  });

  it("トップ（home）の title はサイト名を含むこと（template が効かないセグメントのため 1 回）", () => {
    for (const home of [ja.meta.pages.home, en.meta.pages.home]) {
      expect(home.title.split(SITE_NAME)).toHaveLength(2);
    }
  });
});

describe("MDX の frontmatter の title", () => {
  const files = listFiles(path.join(ROOT, "src", "content"), /\.mdx$/);

  it("MDX が見つかること（ガイド・ブログ・用途別・en のガイド）", () => {
    const rel = files.map((f) => path.relative(ROOT, f).split(path.sep).join("/"));
    expect(rel.some((f) => f.startsWith("src/content/guide/"))).toBe(true);
    expect(rel.some((f) => f.startsWith("src/content/blog/"))).toBe(true);
    expect(rel.some((f) => f.startsWith("src/content/use-cases/"))).toBe(true);
    expect(rel.some((f) => f.startsWith("src/content/en/guide/"))).toBe(true);
  });

  it.each(files.map((f) => [path.relative(ROOT, f).split(path.sep).join("/"), f]))(
    "%s の title にサイト名を含まないこと",
    (_rel, file) => {
      const { data } = matter(fs.readFileSync(file, "utf8"));
      expect(typeof data.title).toBe("string");
      expect(data.title).not.toContain(SITE_NAME);
    }
  );
});

describe("page.tsx に直書きした title", () => {
  const pages = listFiles(path.join(ROOT, "src", "app"), /\.tsx$/, "page.tsx");

  it("poster/page.tsx が対象に含まれること", () => {
    expect(pages.some((f) => f.split(path.sep).join("/").includes("/poster/page.tsx"))).toBe(true);
  });

  it.each(pages.map((f) => [path.relative(ROOT, f).split(path.sep).join("/"), f]))(
    "%s の title 文字列リテラルにサイト名を含まないこと",
    (_rel, file) => {
      const source = fs.readFileSync(file, "utf8");
      const literals = [...source.matchAll(/\btitle:\s*(["'`])((?:(?!\1).)*)\1/g)].map((m) => m[2]);
      for (const title of literals) {
        expect(title).not.toContain(SITE_NAME);
      }
    }
  );
});

describe("buildMetadata の og:title / twitter:title", () => {
  const base = { description: "d", path: "/x" };

  it("サイト名の無い title には、og / twitter にサイト名が 1 回付き、title そのものは変わらないこと", () => {
    const m = buildMetadata({ ...base, title: "QRコード生成" });
    expect(m.title).toBe("QRコード生成");
    expect(m.openGraph?.title).toBe("QRコード生成 | QR Code Create");
    expect(m.twitter?.title).toBe("QRコード生成 | QR Code Create");
  });

  it("サイト名入りの title（トップ）はそのままで、2 回にならないこと", () => {
    const title = "QR Code Create - UTMパラメータ付きQRコード生成ツール";
    const m = buildMetadata({ ...base, title });
    expect(m.openGraph?.title).toBe(title);
    expect(m.twitter?.title).toBe(title);
    expect(String(m.openGraph?.title).split(SITE_NAME)).toHaveLength(2);
  });

  it("ポスターの title でも og / twitter にサイト名が 1 回だけ付くこと", () => {
    const m = buildMetadata({ ...base, title: "印刷用QRコードポスター作成 | A4で4枚同時印刷" });
    expect(String(m.openGraph?.title).split(SITE_NAME)).toHaveLength(2);
    expect(String(m.twitter?.title).split(SITE_NAME)).toHaveLength(2);
  });
});
