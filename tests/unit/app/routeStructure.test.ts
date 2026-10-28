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

  it("src/app/[locale]/layout.tsx が RootShell を検証済みの locale で使うこと", () => {
    expect(exists("[locale]", "layout.tsx")).toBe(true);
    const src = read("[locale]", "layout.tsx");
    expect(src).toMatch(/import\s*\{\s*RootShell\s*\}/);
    expect(src).toMatch(/<RootShell\s+locale=\{locale\}/);
  });

  it("src/app/[locale]/layout.tsx が dynamicParams = false と NON_JA_LOCALES の generateStaticParams を持つこと", () => {
    const src = read("[locale]", "layout.tsx");
    expect(src).toMatch(/export\s+const\s+dynamicParams\s*=\s*false/);
    expect(src).toMatch(/NON_JA_LOCALES\.map/);
  });

  // ja / en のメタデータ取り違えを検知する
  it("src/app/(ja)/layout.tsx が rootMetadataJa を metadata にし、rootMetadataEn を使わないこと", () => {
    const src = read("(ja)", "layout.tsx");
    expect(src).toMatch(/export\s+const\s+metadata\s*=\s*rootMetadataJa\b/);
    expect(src).not.toMatch(/rootMetadataEn/);
  });

  it("src/app/[locale]/layout.tsx が buildRootMetadata を generateMetadata で使い、rootMetadataJa を使わないこと", () => {
    const src = read("[locale]", "layout.tsx");
    expect(src).toMatch(/export\s+async\s+function\s+generateMetadata/);
    expect(src).toMatch(/buildRootMetadata\(/);
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
  it("src/app/(ja)/not-found.tsx が存在し、NotFoundContent を locale=\"ja\" で使うこと", () => {
    expect(exists("(ja)", "not-found.tsx")).toBe(true);
    expect(read("(ja)", "not-found.tsx")).toMatch(/<NotFoundContent\s+locale="ja"/);
  });

  it("src/app/[locale]/not-found.tsx が存在し、LocaleNotFound を使うこと", () => {
    expect(exists("[locale]", "not-found.tsx")).toBe(true);
    expect(read("[locale]", "not-found.tsx")).toMatch(/<LocaleNotFound\s*\/>/);
  });

  it("src/app/[locale]/[...rest] の catch-all が無いこと", () => {
    expect(exists("[locale]", "[...rest]")).toBe(false);
  });
});

describe("英語版トップ（T3 で本実装）", () => {
  // 仮ページの noindex は T3 で外した。英語の metadata（PAGE_METADATA_EN.home）で出力する
  it("src/app/[locale]/page.tsx が noindex ではなく、getLocalePageMetadata の home と HomePageView を使うこと", () => {
    expect(exists("[locale]", "page.tsx")).toBe(true);
    const src = read("[locale]", "page.tsx");
    expect(src).not.toMatch(/index:\s*false/);
    expect(src).toMatch(/buildMetadata\(getLocalePageMetadata\(locale\)\.home,\s*locale\)/);
    expect(src).toMatch(/<HomePageView\s+locale=\{locale\}/);
  });

  it("src/app/[locale]/(tool)/create/page.tsx が CreatePageView を使うこと", () => {
    expect(exists("[locale]", "(tool)", "create", "page.tsx")).toBe(true);
    expect(read("[locale]", "(tool)", "create", "page.tsx")).toMatch(
      /<CreatePageView\s+locale=\{locale\}/
    );
  });

  // 意図（qr_code_create-01z.4）: /{locale}/create は言語別の metadata（create）で出力する
  it("src/app/[locale]/(tool)/create/page.tsx が buildMetadata(getLocalePageMetadata(locale).create, locale) を使い noindex でないこと", () => {
    const src = read("[locale]", "(tool)", "create", "page.tsx");
    expect(src).toMatch(/buildMetadata\(getLocalePageMetadata\(locale\)\.create,\s*locale\)/);
    expect(src).not.toMatch(/PAGE_METADATA\.create/);
    expect(src).not.toMatch(/index:\s*false/);
  });
});

describe("ja の [slug] ページは dynamicParams = false（qr_code_create-xjj）", () => {
  // 意図: generateStaticParams に無い slug を実行時に解決させず 404 にする（en の guide と同じ）
  it.each([
    [["(ja)", "(marketing)", "guide", "[slug]", "page.tsx"]],
    [["(ja)", "(marketing)", "blog", "[slug]", "page.tsx"]],
    [["(ja)", "(marketing)", "use-cases", "[slug]", "page.tsx"]],
  ])("src/app/%j が dynamicParams = false を export すること", (segments) => {
    expect(read(...segments)).toMatch(/export\s+const\s+dynamicParams\s*=\s*false/);
  });
});

describe("英語ガイド（T4）", () => {
  // 意図（qr_code_create-01z.5）: 英語ガイドのルートと、ja / en 共通のページ本体の配置
  it.each([
    [["[locale]", "(marketing)", "layout.tsx"]],
    [["[locale]", "(marketing)", "guide", "[slug]", "page.tsx"]],
  ])("src/app/%j が存在すること", (segments) => {
    expect(exists(...segments)).toBe(true);
  });

  it("src/app/en が存在しないこと（[locale] に移した）", () => {
    expect(exists("en")).toBe(false);
  });

  it("src/app/[locale]/(marketing)/guide/[slug]/page.tsx が GuideArticlePageView を検証済みの locale で使い、dynamicParams = false", () => {
    const src = read("[locale]", "(marketing)", "guide", "[slug]", "page.tsx");
    expect(src).toMatch(/<GuideArticlePageView\s+locale=\{locale\}/);
    expect(src).toMatch(/export\s+const\s+dynamicParams\s*=\s*false/);
  });

  it("src/app/(ja)/(marketing)/guide/[slug]/page.tsx が GuideArticlePageView を locale=\"ja\" で使うこと", () => {
    expect(read("(ja)", "(marketing)", "guide", "[slug]", "page.tsx")).toMatch(
      /<GuideArticlePageView\s+locale="ja"/
    );
  });

  // 意図: guide.module.css はページ本体と一緒に components/pages へ移った
  it("guide.module.css が GuideArticlePageView の隣にあり、旧位置に無いこと", () => {
    expect(
      fs.existsSync(path.join(ROOT, "src", "components", "pages", "GuideArticlePageView", "guide.module.css"))
    ).toBe(true);
    expect(exists("(ja)", "(marketing)", "guide", "[slug]", "guide.module.css")).toBe(false);
  });

  it("英語の MDX src/content/en/guide/getting-started.mdx が存在すること", () => {
    expect(fs.existsSync(path.join(ROOT, "src", "content", "en", "guide", "getting-started.mdx"))).toBe(true);
  });
});
