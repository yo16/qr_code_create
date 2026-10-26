/**
 * @jest-environment node
 */
// 静的出力（qr_code_create-01z.1）: ルートレイアウトを (ja) と en に分割した後も、
// 主要ページが静的 HTML として出力され、動的レンダリングを招く API を使っていないことを固定する。
// ビルド成果物のブロックは .next/server/app が無ければ skip（REQUIRE_BUILD_OUTPUT=1 なら fail）。
import fs from "fs";
import path from "path";
import { en } from "@/i18n/en";
import { enClient } from "@/i18n/enClient";

const ROOT = process.cwd();
const APP = path.join(ROOT, "src", "app");
const BUILD_APP = path.join(ROOT, ".next", "server", "app");

// 前提: このブロックは `npm run build` の成果物（.next/server/app）に依存する。
// - .next/server/app が無ければ skip する（ビルドしていない環境で jest 全件を回せるように）。
// - 環境変数 REQUIRE_BUILD_OUTPUT=1 のときは skip せず、成果物が無ければ
//   「`npm run build` 後に実行してください」で fail する（ビルド後の検証で使う）。
// 下の「動的レンダリングを招く API」ブロックはソースだけを読むので常に実行する。
const REQUIRE_BUILD_OUTPUT = process.env.REQUIRE_BUILD_OUTPUT === "1";
const describeBuildOutput =
  REQUIRE_BUILD_OUTPUT || fs.existsSync(BUILD_APP) ? describe : describe.skip;

describeBuildOutput("ビルド成果物の静的 HTML", () => {
  it.each(["index.html", "en.html", "create.html", "guide/getting-started.html"])(
    ".next/server/app/%s が存在すること",
    (file) => {
      const full = path.join(BUILD_APP, ...file.split("/"));
      if (!fs.existsSync(full)) {
        throw new Error(
          `${full} がありません。静的に出力されていないか、ビルド前です。\`npm run build\` 後に実行してください。`
        );
      }
      expect(fs.existsSync(full)).toBe(true);
    }
  );

  // 意図（qr_code_create-01z.5）: 英語ガイドが lang="en" の静的 HTML として出力され、
  // 英語の MDX が無い slug（utm-setup）は dynamicParams = false で生成されない
  it("en/guide/getting-started.html が lang=\"en\" で生成されていること", () => {
    const full = path.join(BUILD_APP, "en", "guide", "getting-started.html");
    if (!fs.existsSync(full)) {
      throw new Error(`${full} がありません。\`npm run build\` 後に実行してください。`);
    }
    const html = fs.readFileSync(full, "utf8");
    expect(html).toMatch(/<html[^>]*\slang="en"/);
    expect(html).toContain("Getting started");
  });

  // 意図: MDX 本文が実際に描画されている（タイトルや CTA など MDX 外の部品だけで素通りしない）。
  // 本文の h2 と、本文中のリンク（ヘッダーや ArticleCta の /en/create はクラス付きなので、
  // クラスなし・本文の文言付きのアンカーで本文由来に限定する）を確かめる
  it("en/guide/getting-started.html に MDX 本文の h2 と本文中の /en/create リンクがあること", () => {
    const full = path.join(BUILD_APP, "en", "guide", "getting-started.html");
    if (!fs.existsSync(full)) {
      throw new Error(`${full} がありません。\`npm run build\` 後に実行してください。`);
    }
    const html = fs.readFileSync(full, "utf8");
    expect(html).toMatch(/<h2[^>]*>What QR Code Create does<\/h2>/);
    expect(html).toContain('<a href="/en/create">Open the QR code generator</a>');
  });

  // 意図（qr_code_create-176）: サイト名「QR Code Create」が <title> と og:title にちょうど 1 回だけ付く。
  // ページ側の title にサイト名を入れると、ルートの template で 2 回になる
  it.each([
    ["index.html"],
    ["en.html"],
    ["create.html"],
    ["en/create.html"],
    ["poster.html"],
    ["guide/getting-started.html"],
    ["faq.html"],
    ["blog/event-survey-qr-poster.html"],
    ["blog/utm-on-off-when-to-use.html"],
  ])("%s の <title> と og:title にサイト名がちょうど 1 回であること", (file) => {
    const full = path.join(BUILD_APP, ...file.split("/"));
    if (!fs.existsSync(full)) {
      throw new Error(`${full} がありません。\`npm run build\` 後に実行してください。`);
    }
    const html = fs.readFileSync(full, "utf8");
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
    const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1];
    expect(title).toBeDefined();
    expect(ogTitle).toBeDefined();
    expect((title as string).split("QR Code Create")).toHaveLength(2);
    expect((ogTitle as string).split("QR Code Create")).toHaveLength(2);
  });

  // 意図（qr_code_create-kg5）: HowTo の url（#step-N）の移動先として、ステップ見出しに id が付いて出力される
  it.each([["guide/getting-started.html"], ["en/guide/getting-started.html"]])(
    "%s に id=step-1〜step-3 の見出しがあること",
    (file) => {
      const full = path.join(BUILD_APP, ...file.split("/"));
      if (!fs.existsSync(full)) {
        throw new Error(full + " がありません。npm run build 後に実行してください。");
      }
      const html = fs.readFileSync(full, "utf8");
      for (const n of [1, 2, 3]) {
        expect(html).toMatch(new RegExp('<h2[^>]*id="step-' + n + '"'));
      }
      expect(html).not.toContain('id="step-4"');
    }
  );

  it("ほかのガイド（download-formats）の h2 に step- の id が付いていないこと", () => {
    const full = path.join(BUILD_APP, "guide", "download-formats.html");
    if (!fs.existsSync(full)) {
      throw new Error(full + " がありません。npm run build 後に実行してください。");
    }
    const html = fs.readFileSync(full, "utf8");
    expect(html).toContain("<h2");
    expect(html).not.toContain('id="step-');
  });

  // 意図（qr_code_create-swm）: `**utm_term**（…）` が太字として描画される。
  // 以前の `**utm_term（…）**` は CommonMark の規則（閉じの ** の直前が記号の全角括弧で、直後が文字）で太字にならず、** が表示されていた
  it("guide/utm-setup.html に <strong>utm_term</strong> と <strong>utm_content</strong> があること", () => {
    const full = path.join(BUILD_APP, "guide", "utm-setup.html");
    if (!fs.existsSync(full)) {
      throw new Error(full + " がありません。npm run build 後に実行してください。");
    }
    const html = fs.readFileSync(full, "utf8");
    expect(html).toContain("<strong>utm_term</strong>");
    expect(html).toContain("<strong>utm_content</strong>");
  });

  // 意図（qr_code_create-6cl）: 生の ** と、strong の入れ子が HTML 本文に残っていない（script・コードブロックを除く）。
  // ディレクトリ単位で検査し、空振り防止として .html が 1 件以上あること、
  // requireStrong のディレクトリでは太字（<strong>）が 1 件以上あることも確かめる
  // （blog は記事が太字を使わないので requireStrong を付けない）
  const expectNoRawBold = (relDir: string[], requireStrong: boolean): void => {
    const dir = path.join(BUILD_APP, ...relDir);
    if (!fs.existsSync(dir)) {
      throw new Error(dir + " がありません。npm run build 後に実行してください。");
    }
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".html"));
    expect(files.length).toBeGreaterThan(0);
    let strongCount = 0;
    for (const file of files) {
      const html = fs.readFileSync(path.join(dir, file), "utf8");
      strongCount += html.split("<strong>").length - 1;
      const text = html
        .replace(/<script[\s\S]*?<\/script>/g, "")
        .replace(/<pre\b[\s\S]*?<\/pre>/g, "")
        .replace(/<code\b[\s\S]*?<\/code>/g, "");
      expect({ file, hasRawBold: text.includes("**") }).toEqual({ file, hasRawBold: false });
      // 太字の崩れ方のもう一つ: strong が閉じる前に次の strong が開く入れ子（生の ** にならない）
      const nested = /<strong\b[^>]*>(?:(?!<\/strong>)[\s\S])*<strong\b/.test(text);
      expect({ file, hasNestedStrong: nested }).toEqual({ file, hasNestedStrong: false });
    }
    if (requireStrong) expect(strongCount).toBeGreaterThan(0);
  };

  it("ja のガイド全件の HTML 本文に、生の ** と strong の入れ子が残っていないこと（script・コードブロックを除く）", () => {
    expectNoRawBold(["guide"], true);
    // 空振り防止: ガイドの HTML が複数あり、太字を使う記事も含まれる
    const files = fs.readdirSync(path.join(BUILD_APP, "guide")).filter((f) => f.endsWith(".html"));
    expect(files.length).toBeGreaterThan(3);
    expect(files).toContain("utm-setup.html");
  });

  it.each([
    ["use-cases", ["use-cases"], true],
    ["blog", ["blog"], false],
    ["en/guide", ["en", "guide"], true],
  ] as [string, string[], boolean][])(
    "%s の全件の HTML 本文に、生の ** と strong の入れ子が残っていないこと（script・コードブロックを除く）",
    (_label, relDir, requireStrong) => {
      expectNoRawBold(relDir, requireStrong);
    }
  );

  // 意図（qr_code_create-6cl）: `**PNG形式**（Nx解像度）を` が太字として描画される。
  // 以前の `**PNG形式（Nx解像度）**を` は閉じの ** の直前が全角「）」で直後が文字のため太字にならず、** が表示されていた。
  // store は後ろに別の ** があり、生の ** ではなく <strong>PNG形式（2x解像度）<strong>…</strong>SVG形式</strong> の入れ子になっていた
  it.each(["menu.html", "product-package.html", "receipt.html", "store.html"])(
    "use-cases/%s に <strong>PNG形式</strong> があること",
    (file) => {
      const full = path.join(BUILD_APP, "use-cases", file);
      if (!fs.existsSync(full)) {
        throw new Error(full + " がありません。npm run build 後に実行してください。");
      }
      const html = fs.readFileSync(full, "utf8");
      expect(html).toContain("<strong>PNG形式</strong>");
    }
  );

  it("en/guide/utm-setup.html が生成されていないこと", () => {
    // 対照: ja 側の utm-setup は生成されている（パスの組み立て違いで素通りしない）
    expect(fs.existsSync(path.join(BUILD_APP, "guide", "utm-setup.html"))).toBe(true);
    expect(fs.existsSync(path.join(BUILD_APP, "en", "guide", "utm-setup.html"))).toBe(false);
  });

  // 意図（qr_code_create-01z.4）: en の文言が Client バンドル（.next/static）に入っていない。
  // en は getDict 経由で Server からだけ読まれ、Client へは RSC ペイロード（HTML 内）で渡る想定。
  // needle は辞書から導出し、Server スライス（hero の説明文）と Client スライス（ボタン・aria-label・ラベル）の両方を含める。
  const SERVER_NEEDLES = [en.home.hero.description];
  const CLIENT_NEEDLES = [
    enClient.tool.download.pngButton,
    enClient.tool.qrPreview.ariaGenerated,
    enClient.decoration.caption.textLabel,
  ];

  // 意図: 対照。同じ文字列がサーバー出力の HTML には入っている（needle が正しく、空振りでない）
  it("対照: needle が .next/server/app の en.html / en/create.html に含まれること", () => {
    const enHtml = fs.readFileSync(path.join(BUILD_APP, "en.html"), "utf8");
    const createHtml = fs.readFileSync(path.join(BUILD_APP, "en", "create.html"), "utf8");
    for (const n of SERVER_NEEDLES) expect(enHtml).toContain(n);
    for (const n of CLIENT_NEEDLES) expect(createHtml).toContain(n);
  });

  // 意図（qr_code_create-01z.7）: 両言語が揃う 6 ページの静的 HTML の head に hreflang が 3 本ずつ出ている。
  // React は属性を hrefLang と出すので、属性名の大文字小文字は無視して照合する
  const HREFLANG_PAGES: { file: string; ja: string; en: string }[] = [
    { file: "index.html", ja: "/", en: "/en" },
    { file: "en.html", ja: "/", en: "/en" },
    { file: "create.html", ja: "/create", en: "/en/create" },
    { file: "en/create.html", ja: "/create", en: "/en/create" },
    { file: "guide/getting-started.html", ja: "/guide/getting-started", en: "/en/guide/getting-started" },
    { file: "en/guide/getting-started.html", ja: "/guide/getting-started", en: "/en/guide/getting-started" },
  ];
  const readHead = (file: string): string => {
    const full = path.join(BUILD_APP, ...file.split("/"));
    if (!fs.existsSync(full)) {
      throw new Error(`${full} がありません。\`npm run build\` 後に実行してください。`);
    }
    const html = fs.readFileSync(full, "utf8");
    const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (!head) throw new Error(`${file} に <head> がありません`);
    return head[1];
  };
  /** head 内の <link rel="alternate" hreflang=...> を { hreflang: pathname } にする */
  const alternateLinks = (head: string): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const tag of head.match(/<link\b[^>]*>/gi) ?? []) {
      if (!/\brel="alternate"/i.test(tag)) continue;
      const lang = tag.match(/\bhreflang="([^"]*)"/i);
      const href = tag.match(/\bhref="([^"]*)"/i);
      if (lang && href) out[lang[1]] = new URL(href[1]).pathname;
    }
    return out;
  };

  it.each(HREFLANG_PAGES)("$file の head に hreflang が ja / en / x-default の 3 本", ({ file, ja, en }) => {
    const head = readHead(file);
    expect((head.match(/<link\b[^>]*\bhreflang="/gi) ?? []).length).toBe(3);
    expect(alternateLinks(head)).toEqual({ ja, en, "x-default": ja });
  });

  // 意図: 英語版の無いページの head には hreflang が出ない（ヘッダーの切り替えリンク a[hreflang] は body 側なので数えない）
  it.each(["guide/utm-setup.html", "faq.html"])("%s の head に hreflang が無い", (file) => {
    const head = readHead(file);
    expect(head).not.toMatch(/hreflang=/i);
    // 空振り防止: canonical は出ている
    expect(head).toMatch(/<link rel="canonical"/);
  });

  // 意図: sitemap の出力に en 3 件と xhtml:link（hreflang）が含まれる
  it("sitemap.xml.body に en 3 件と xhtml:link がある", () => {
    const full = path.join(BUILD_APP, "sitemap.xml.body");
    if (!fs.existsSync(full)) {
      throw new Error(`${full} がありません。\`npm run build\` 後に実行してください。`);
    }
    const xml = fs.readFileSync(full, "utf8");
    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    expect(locs.filter((p) => /^\/en(\/|$)/.test(p)).sort()).toEqual(
      ["/en", "/en/create", "/en/guide/getting-started"].sort()
    );
    // 6 エントリ × 3 本
    expect((xml.match(/<xhtml:link rel="alternate" hreflang="/g) ?? []).length).toBe(18);
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  });

  // 意図: sitemap の xhtml:link と HTML の hreflang が食い違わない。
  // sitemap を <url> 単位で解析し、xhtml:link を持つ 6 件それぞれで
  // (1) 自言語の xhtml:link が loc と一致、(2) 同じページの HTML の hreflang 3 本と一致（new URL().href で正規化）
  it("sitemap の xhtml:link を持つ 6 件が自言語で loc と一致し、HTML の hreflang 3 本とも一致する", () => {
    const full = path.join(BUILD_APP, "sitemap.xml.body");
    if (!fs.existsSync(full)) {
      throw new Error(`${full} がありません。\`npm run build\` 後に実行してください。`);
    }
    const xml = fs.readFileSync(full, "utf8");
    const href = (u: string) => new URL(u).href;
    const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
      .map((m) => {
        const loc = m[1].match(/<loc>([^<]*)<\/loc>/);
        if (!loc) throw new Error(`<loc> の無い <url>: ${m[1]}`);
        const links: Record<string, string> = {};
        for (const l of m[1].matchAll(/<xhtml:link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g)) {
          links[l[1]] = href(l[2]);
        }
        return { loc: href(loc[1]), links };
      })
      .filter((e) => Object.keys(e.links).length > 0);

    // パス → ビルド成果物の HTML
    const fileOf: Record<string, string> = Object.fromEntries(
      HREFLANG_PAGES.map((p) => {
        const isEn = p.file.startsWith("en");
        return [isEn ? p.en : p.ja, p.file];
      })
    );
    expect(entries.map((e) => new URL(e.loc).pathname).sort()).toEqual(Object.keys(fileOf).sort());

    for (const { loc, links } of entries) {
      const pathname = new URL(loc).pathname;
      const self = /^\/en(\/|$)/.test(pathname) ? "en" : "ja";
      expect({ loc, keys: Object.keys(links).sort() }).toEqual({ loc, keys: ["en", "ja", "x-default"] });
      expect({ loc, self: links[self] }).toEqual({ loc, self: loc });

      const head = readHead(fileOf[pathname]);
      const htmlLinks: Record<string, string> = {};
      for (const tag of head.match(/<link\b[^>]*>/gi) ?? []) {
        if (!/\brel="alternate"/i.test(tag)) continue;
        const lang = tag.match(/\bhreflang="([^"]*)"/i);
        const h = tag.match(/\bhref="([^"]*)"/i);
        if (lang && h) htmlLinks[lang[1]] = href(h[1]);
      }
      expect({ loc, htmlLinks }).toEqual({ loc, htmlLinks: links });
    }
  });

  it(".next/static に en 固有の文字列（Server / Client スライスの代表）が無いこと", () => {
    const STATIC = path.join(ROOT, ".next", "static");
    if (!fs.existsSync(STATIC)) {
      throw new Error(`${STATIC} がありません。\`npm run build\` 後に実行してください。`);
    }
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        return /\.(js|html|json|txt)$/.test(entry.name) ? [full] : [];
      });
    const files = walk(STATIC);
    expect(files.length).toBeGreaterThan(0);
    const needles = [...SERVER_NEEDLES, ...CLIENT_NEEDLES];
    const hits = files.flatMap((file) => {
      const text = fs.readFileSync(file, "utf8");
      return needles
        .filter((n) => text.includes(n))
        .map((n) => `${path.relative(ROOT, file)}: ${n}`);
    });
    expect(hits).toEqual([]);
  });
});

describe("動的レンダリングを招く API を使っていないこと", () => {
  const DYNAMIC_API = /\bheaders\(|\bcookies\(|\bsearchParams\b/;

  const listFiles = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return listFiles(full);
      return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
    });

  const targets = [
    ...listFiles(path.join(APP, "en")),
    path.join(ROOT, "src", "components", "layout", "RootShell", "RootShell.tsx"),
    path.join(APP, "(ja)", "layout.tsx"),
  ];

  it("対象ファイルが 1 件以上あること", () => {
    expect(targets.length).toBeGreaterThan(2);
  });

  it.each(targets.map((t) => [path.relative(ROOT, t), t]))(
    "%s に headers( / cookies( / searchParams が無いこと",
    (_label, file) => {
      expect(fs.readFileSync(file, "utf8")).not.toMatch(DYNAMIC_API);
    }
  );
});
