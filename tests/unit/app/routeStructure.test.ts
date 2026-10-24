/**
 * @jest-environment node
 */
// ルート構造（qr_code_create-01z.1）: ルートレイアウトを (ja) と en に分割した構造をファイルシステムで固定する。
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const APP = path.join(ROOT, "src", "app");

const exists = (...segments: string[]) => fs.existsSync(path.join(APP, ...segments));
const read = (...segments: string[]) => fs.readFileSync(path.join(APP, ...segments), "utf8");

describe("ルートレイアウトの分割", () => {
  it("src/app/layout.tsx（単一のルートレイアウト）が存在しないこと", () => {
    expect(exists("layout.tsx")).toBe(false);
  });

  it("src/app/(ja)/layout.tsx が RootShell を locale=\"ja\" で使うこと", () => {
    expect(exists("(ja)", "layout.tsx")).toBe(true);
    const src = read("(ja)", "layout.tsx");
    expect(src).toMatch(/import\s*\{\s*RootShell\s*\}/);
    expect(src).toMatch(/<RootShell\s+locale="ja"/);
  });

  it("src/app/en/layout.tsx が RootShell を locale=\"en\" で使うこと", () => {
    expect(exists("en", "layout.tsx")).toBe(true);
    const src = read("en", "layout.tsx");
    expect(src).toMatch(/import\s*\{\s*RootShell\s*\}/);
    expect(src).toMatch(/<RootShell\s+locale="en"/);
  });

  // ja / en のメタデータ取り違えを検知する
  it("src/app/(ja)/layout.tsx が rootMetadataJa を metadata にし、rootMetadataEn を使わないこと", () => {
    const src = read("(ja)", "layout.tsx");
    expect(src).toMatch(/export\s+const\s+metadata\s*=\s*rootMetadataJa\b/);
    expect(src).not.toMatch(/rootMetadataEn/);
  });

  it("src/app/en/layout.tsx が rootMetadataEn を metadata にし、rootMetadataJa を使わないこと", () => {
    const src = read("en", "layout.tsx");
    expect(src).toMatch(/export\s+const\s+metadata\s*=\s*rootMetadataEn\b/);
    expect(src).not.toMatch(/rootMetadataJa/);
  });
});

describe("日本語ページの移動先", () => {
  it.each([["(ja)", "(marketing)"], ["(ja)", "(tool)"], ["(ja)", "page.tsx"]])(
    "src/app/%s/%s が存在すること",
    (...segments) => {
      expect(exists(...segments)).toBe(true);
    }
  );

  it.each(["(marketing)", "(tool)", "page.tsx", "page.module.css"])(
    "旧パス src/app/%s が存在しないこと",
    (name) => {
      expect(exists(name)).toBe(false);
    }
  );
});

describe("メタデータファイルの配置", () => {
  it.each(["icon.svg", "icon.png", "apple-icon.png", "favicon.ico", "sitemap.ts", "robots.ts"])(
    "src/app/%s が src/app 直下にあること",
    (name) => {
      expect(exists(name)).toBe(true);
    }
  );
});

describe("global-not-found", () => {
  it("next.config.ts で experimental.globalNotFound が true であること", () => {
    const config = fs.readFileSync(path.join(ROOT, "next.config.ts"), "utf8");
    // コメント行（// globalNotFound: true）に一致しないよう、行頭から空白のみを挟んだ形に限定する
    expect(config).toMatch(/^[ \t]*globalNotFound:\s*true\b/m);
  });

  it("src/app/global-not-found.tsx が存在し、RootShell を locale=\"ja\" で使うこと", () => {
    expect(exists("global-not-found.tsx")).toBe(true);
    expect(read("global-not-found.tsx")).toMatch(/<RootShell\s+locale="ja"/);
  });

  it("src/app/global-not-found.tsx が NotFoundContent を locale=\"ja\" で使うこと", () => {
    const src = read("global-not-found.tsx");
    expect(src).toMatch(/import\s*\{\s*NotFoundContent\s*\}/);
    expect(src).toMatch(/<NotFoundContent\s+locale="ja"/);
  });
});

describe("ルートグループごとの not-found", () => {
  it.each([
    [["(ja)", "not-found.tsx"], "ja"],
    [["en", "not-found.tsx"], "en"],
  ] as const)("src/app/%j が存在し、NotFoundContent を locale=\"%s\" で使うこと", (segments, locale) => {
    expect(exists(...segments)).toBe(true);
    expect(read(...segments)).toMatch(new RegExp(`<NotFoundContent\\s+locale="${locale}"`));
  });
});

describe("英語版トップ（T3 で本実装）", () => {
  // 仮ページの noindex は T3 で外した。英語の metadata（PAGE_METADATA_EN.home）で出力する
  it("src/app/en/page.tsx が noindex ではなく、PAGE_METADATA_EN.home と HomePageView(en) を使うこと", () => {
    expect(exists("en", "page.tsx")).toBe(true);
    const src = read("en", "page.tsx");
    expect(src).not.toMatch(/index:\s*false/);
    expect(src).toMatch(/buildMetadata\(PAGE_METADATA_EN\.home,\s*"en"\)/);
    expect(src).toMatch(/<HomePageView\s+locale="en"/);
  });

  it("src/app/en/(tool)/create/page.tsx が CreatePageView(en) を使うこと", () => {
    expect(exists("en", "(tool)", "create", "page.tsx")).toBe(true);
    expect(read("en", "(tool)", "create", "page.tsx")).toMatch(
      /<CreatePageView\s+locale="en"/
    );
  });

  // 意図（qr_code_create-01z.4）: 英語の /create は英語の metadata（PAGE_METADATA_EN.create）で出力する
  it("src/app/en/(tool)/create/page.tsx が buildMetadata(PAGE_METADATA_EN.create, \"en\") を使い noindex でないこと", () => {
    const src = read("en", "(tool)", "create", "page.tsx");
    expect(src).toMatch(/buildMetadata\(PAGE_METADATA_EN\.create,\s*"en"\)/);
    expect(src).not.toMatch(/PAGE_METADATA\.create/);
    expect(src).not.toMatch(/index:\s*false/);
  });
});
