import sitemap from "@/app/sitemap";
import { buildLlmsTxt } from "@/lib/seo/llmsTxt";
import { LOCALES, NON_JA_LOCALES } from "@/i18n/locales";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";
import { FEATURE_FLAGS } from "@/lib/constants/features";

const SITE = "https://qr-create.jp";
const content = buildLlmsTxt();

function section(text: string, heading: string): string {
  const start = text.indexOf(`${heading}\n`);
  expect(start).toBeGreaterThanOrEqual(0);
  const rest = text.slice(start + heading.length);
  const next = rest.indexOf("\n## ");
  return next === -1 ? rest : rest.slice(0, next);
}

/** Markdown リンク [..](url) の url を全部取り出す */
function urlsOf(text: string): string[] {
  return [...text.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]);
}

const sitemapUrls = sitemap().map((e) => e.url);
const prefixes = NON_JA_LOCALES.map((l) => LOCALE_CONFIG[l].prefix);
const isNonJa = (url: string): boolean =>
  prefixes.some((p) => url === `${SITE}${p}` || url.startsWith(`${SITE}${p}/`));

describe("llms.txt: 基本構造", () => {
  it("# QR Code Create の見出しと > 要約があること", () => {
    expect(content).toMatch(/^# QR Code Create$/m);
    expect(content).toMatch(/^> .+$/m);
  });

  it("サイトURLが記載され、vercel.app を含まないこと", () => {
    expect(content).toContain(SITE);
    expect(content).not.toContain("vercel.app");
  });

  it.each(["## Pages", "## Features", "## Target Users", "## Key Differentiator", "## Language", "## Other languages"])(
    "%s の節があること",
    (heading) => {
      expect(content).toContain(heading);
    },
  );

  it.each(["## Overview", "## URL"])("古い節 %s が無いこと", (heading) => {
    expect(content).not.toContain(heading);
  });

  it("古い文言 'All pages are written in Japanese' が無いこと", () => {
    expect(content).not.toContain("All pages are written in Japanese");
  });
});

describe("llms.txt: Pages 節", () => {
  const pages = section(content, "## Pages");

  it.each(["/create", "/guide", "/use-cases", "/blog", "/faq"])(
    "主要ページ %s の行があり、説明（: .+）が付いていること",
    (p) => {
      expect(pages).toMatch(new RegExp(`^- \\[[^\\]]+\\]\\(${SITE}${p}\\): .+$`, "m"));
    },
  );

  it("トップの行（末尾スラッシュなしの SITE_URL）があり、説明が付いていること", () => {
    expect(pages).toMatch(new RegExp(`^- \\[[^\\]]+\\]\\(${SITE}\\): .+$`, "m"));
    expect(pages).not.toContain(`(${SITE}/)`);
  });

  it("/contact の行があり、説明が付いていること", () => {
    expect(pages).toMatch(new RegExp(`^- \\[[^\\]]+\\]\\(${SITE}/contact\\): .+$`, "m"));
  });

  it("Pages 節の全項目に説明（: .+）が付いていること", () => {
    const items = pages.split("\n").filter((l) => l.startsWith("- "));
    expect(items.length).toBeGreaterThan(0);
    for (const line of items) expect(line).toMatch(/: .+$/);
  });

  it("機能フラグ true のとき /poster の行に説明があり、Features にポスターの行もあること", () => {
    expect(FEATURE_FLAGS.posterPage).toBe(true);
    expect(pages).toMatch(new RegExp(`^- \\[[^\\]]+\\]\\(${SITE}/poster\\): .+$`, "m"));
    expect(section(content, "## Features")).toMatch(/^- Poster maker/m);
  });

  it("noindex の /privacy と /terms がどこにも無いこと", () => {
    expect(content).not.toContain("/privacy");
    expect(content).not.toContain("/terms");
  });
});

describe("llms.txt: sitemap との一致", () => {
  const llmsUrls = urlsOf(content);

  it("sitemap の ja の URL（noindex は sitemap に無い。例外なし）がすべて llms.txt にあること", () => {
    const expected = sitemapUrls.filter((u) => !isNonJa(u));
    // 空振り防止: トップ・create・記事（guide / use-cases / blog）が含まれる
    expect(expected.length).toBeGreaterThan(10);
    expect(expected).toEqual(expect.arrayContaining([SITE, `${SITE}/create`]));
    expect(expected.some((u) => u.includes("/blog/"))).toBe(true);
    expect(expected.some((u) => u.includes("/use-cases/"))).toBe(true);
    expect(expected.some((u) => u.includes("/guide/"))).toBe(true);
    expect(expected.filter((u) => !llmsUrls.includes(u))).toEqual([]);
  });

  it("sitemap の各言語の URL（トップ、/create、ガイド）がすべて llms.txt にあること", () => {
    const nonJaUrls = sitemapUrls.filter(isNonJa);
    expect(nonJaUrls.length).toBe(NON_JA_LOCALES.length * 3);
    expect(nonJaUrls.filter((u) => !llmsUrls.includes(u))).toEqual([]);
  });

  it.each(NON_JA_LOCALES)("%s のトップ URL（接頭辞のみ）が llms.txt にあること", (l) => {
    expect(llmsUrls).toContain(`${SITE}${LOCALE_CONFIG[l].prefix}`);
  });

  it("llms.txt の URL がすべて sitemap にあること（食い違いの検出）", () => {
    // 空振り防止: sitemap にない URL を足せば検出される
    expect(llmsUrls.length).toBeGreaterThan(10);
    expect(llmsUrls.filter((u) => !sitemapUrls.includes(u))).toEqual([]);
  });

  it("llms.txt の URL に重複が無いこと", () => {
    expect(llmsUrls.filter((u, i) => llmsUrls.indexOf(u) !== i)).toEqual([]);
  });

  it("検出の確認: 存在しない URL は llms.txt に無く、sitemap にも無いこと", () => {
    expect(llmsUrls).not.toContain(`${SITE}/no-such-page`);
    expect(sitemapUrls).not.toContain(`${SITE}/no-such-page`);
  });
});

describe("llms.txt: Other languages 節", () => {
  const other = section(content, "## Other languages");
  const items = other.split("\n").filter((l) => l.startsWith("- "));

  it("項目が 言語数 x 3 ページあること", () => {
    expect(items).toHaveLength(NON_JA_LOCALES.length * 3);
  });

  it.each(NON_JA_LOCALES)("%s の項目名が '{nativeName}: {ページ名}' の形であること", (l) => {
    const { nativeName } = LOCALE_CONFIG[l];
    const mine = items.filter((line) => line.startsWith(`- [${nativeName}: `));
    expect(mine).toHaveLength(3);
    const names = mine.map((line) => line.match(/^- \[[^:]+: ([^\]]+)\]/)?.[1]);
    expect(names).toEqual(["Top page", "QR code generator", "Getting started"]);
  });

  it("項目名が ja 側のパスの形（': /'）になっていないこと", () => {
    for (const line of items) {
      const title = line.match(/^- \[([^\]]+)\]/)?.[1] ?? "";
      expect(title).not.toMatch(/: \//);
    }
  });

  it("各言語の URL が接頭辞付きであること（ja 側のパスを指していない）", () => {
    for (const l of NON_JA_LOCALES) {
      const prefix = LOCALE_CONFIG[l].prefix;
      expect(other).toContain(`(${SITE}${prefix})`);
      expect(other).toContain(`(${SITE}${prefix}/create)`);
      expect(other).toContain(`(${SITE}${prefix}/guide/getting-started)`);
    }
  });
});

describe("llms.txt: Language 節", () => {
  const language = section(content, "## Language");

  it("ja が全ページを持つことを説明していること", () => {
    expect(LOCALES).toContain("ja");
    expect(language).toContain(`Japanese (${LOCALE_CONFIG.ja.hreflang})`);
    expect(language).toMatch(/every page/);
  });

  it.each(NON_JA_LOCALES)("言語コード %s が挙がっていること", (l) => {
    expect(language).toContain(l);
  });

  it("ja 以外は 3 ページ（トップ、/create、/guide/getting-started）だけと説明していること", () => {
    expect(language).toMatch(/three pages/);
    expect(language).toContain("/create");
    expect(language).toContain("/guide/getting-started");
  });
});
