import fs from "fs";
import path from "path";

const LLMS_PATH = path.join(process.cwd(), "public", "llms.txt");

describe("llms.txt", () => {
  it("public/llms.txt ファイルが存在すること", () => {
    expect(fs.existsSync(LLMS_PATH)).toBe(true);
  });

  it("必須セクション ## Overview が含まれること", () => {
    const content = fs.readFileSync(LLMS_PATH, "utf-8");
    expect(content).toContain("## Overview");
  });

  it("必須セクション ## Features が含まれること", () => {
    const content = fs.readFileSync(LLMS_PATH, "utf-8");
    expect(content).toContain("## Features");
  });

  it("必須セクション ## Target Users が含まれること", () => {
    const content = fs.readFileSync(LLMS_PATH, "utf-8");
    expect(content).toContain("## Target Users");
  });

  it("必須セクション ## URL が含まれること", () => {
    const content = fs.readFileSync(LLMS_PATH, "utf-8");
    expect(content).toContain("## URL");
  });

  it("サイトURLが記載されていること", () => {
    const content = fs.readFileSync(LLMS_PATH, "utf-8");
    expect(content).toMatch(/https?:\/\//);
  });

  it("QR Code Create のプロダクト名が含まれること", () => {
    const content = fs.readFileSync(LLMS_PATH, "utf-8");
    expect(content).toContain("QR Code Create");
  });

  // --- qr_code_create-ksi: URL の qr-create.jp への修正と主要ページ一覧の追加 ---

  // 意図: 旧 URL https://qr-code-create.vercel.app は現在別の QR 生成サービスを返すため、
  // AI クローラーに競合を案内しないよう、vercel.app への言及がファイル全体に残っていないことを保証する
  it("vercel.app を含まないこと", () => {
    const content = fs.readFileSync(LLMS_PATH, "utf-8");
    expect(content).not.toContain("vercel.app");
  });

  // 意図: ## URL セクション（次の ## 見出しまで）に正しいサイト URL https://qr-create.jp が記載されていること。
  // 他セクションのリンクで偶然一致しないよう、URL セクションの範囲だけを対象にする
  it("## URL セクションに https://qr-create.jp が記載されていること", () => {
    const content = fs.readFileSync(LLMS_PATH, "utf-8");
    const start = content.indexOf("## URL");
    expect(start).toBeGreaterThanOrEqual(0);
    const rest = content.slice(start + "## URL".length);
    const nextHeading = rest.search(/\n## /);
    const urlSection = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
    expect(urlSection).toContain("https://qr-create.jp");
  });

  // 意図: AI クローラーが主要ページを辿れるよう、ページ一覧の ## Pages セクションが存在すること
  it("## Pages セクションが存在すること", () => {
    const content = fs.readFileSync(LLMS_PATH, "utf-8");
    expect(content).toContain("## Pages");
  });

  // 意図: 主要ページが相対パスではなく qr-create.jp ドメインの絶対 URL で列挙されていること
  it.each([
    "https://qr-create.jp/create",
    "https://qr-create.jp/poster",
    "https://qr-create.jp/guide",
    "https://qr-create.jp/guide/getting-started",
    "https://qr-create.jp/use-cases",
    "https://qr-create.jp/faq",
  ])("主要ページの絶対 URL %s が列挙されていること", (url) => {
    const content = fs.readFileSync(LLMS_PATH, "utf-8");
    expect(content).toContain(url);
  });
});

// qr_code_create-b4m: /poster の公開に合わせて llms.txt に載せる
describe("llms.txt の /poster", () => {
  function section(content: string, heading: string): string {
    const start = content.indexOf(heading);
    expect(start).toBeGreaterThanOrEqual(0);
    const rest = content.slice(start + heading.length);
    const next = rest.indexOf(String.fromCharCode(10) + "## ");
    return next === -1 ? rest : rest.slice(0, next);
  }

  it("## Pages に /poster の行（絶対 URL と説明）があること", () => {
    const pages = section(fs.readFileSync(LLMS_PATH, "utf-8"), "## Pages");
    expect(pages).toMatch(/^- https:\/\/qr-create\.jp\/poster : .+$/m);
  });

  it("## Features にポスター作成の行があること", () => {
    const features = section(fs.readFileSync(LLMS_PATH, "utf-8"), "## Features");
    expect(features).toMatch(/^- Poster maker/m);
  });

  it("sitemap の主要な ja ページが ## Pages にすべて載っていること（/poster を含む）", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const pages = section(fs.readFileSync(LLMS_PATH, "utf-8"), "## Pages");
    const site = "https://qr-create.jp";
    const paths = sitemap()
      .map((entry) => new URL(entry.url).pathname)
      .filter((p) => !p.startsWith("/en"));
    // llms.txt に載せる主要ページ（法務系・個別記事は対象外）
    const main = ["/", "/create", "/poster", "/guide", "/use-cases", "/faq", "/blog"];
    for (const p of main) {
      expect(paths).toContain(p);
      const url = p === "/" ? `${site}/ ` : `${site}${p} `;
      expect(pages).toContain(url);
    }
  });
});
