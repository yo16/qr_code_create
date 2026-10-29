/**
 * @jest-environment node
 */
// 静的出力（qr_code_create-01z.1）: ルートレイアウトを (ja) と en に分割した後も、
// 主要ページが静的 HTML として出力され、動的レンダリングを招く API を使っていないことを固定する。
// ビルド成果物のブロックは .next/server/app が無ければ skip（REQUIRE_BUILD_OUTPUT=1 なら fail）。
import fs from "fs";
import path from "path";
import { en } from "@/i18n/en";
import { LOCALES, NON_JA_LOCALES } from "@/i18n/locales";
import { LOCALE_CONFIG, TRANSLATED_PATHS } from "@/lib/i18n/localeConfig";
import { localePath } from "@/lib/i18n/routes";
import { es } from "@/i18n/es";
import { ptBr } from "@/i18n/ptBr";
import { de } from "@/i18n/de";

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
  // M4: ja 以外の全言語（NON_JA_LOCALES）の 3 ページも静的 HTML になる
  it.each([
    "index.html",
    "create.html",
    "guide/getting-started.html",
    ...NON_JA_LOCALES.flatMap((l) => [`${l}.html`, `${l}/create.html`, `${l}/guide/getting-started.html`]),
  ])(
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

  // 意図（M4）: 全言語のトップ・作成・ガイドの静的 HTML が自分の lang を持つ
  it.each(
    NON_JA_LOCALES.flatMap((l) =>
      ["", "/create", "/guide/getting-started"].map((p) => [`${l}${p}`, l] as [string, (typeof NON_JA_LOCALES)[number]])
    )
  )("%s.html が自言語の lang で生成されていること", (rel, l) => {
    const full = path.join(BUILD_APP, ...`${rel}.html`.split("/"));
    if (!fs.existsSync(full)) throw new Error(`${full} がありません。\`npm run build\` 後に実行してください。`);
    expect(fs.readFileSync(full, "utf8")).toMatch(new RegExp(`<html[^>]*\\slang="${LOCALE_CONFIG[l].htmlLang}"`));
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
    ["create.html"],
    ...NON_JA_LOCALES.flatMap((l) => [[`${l}.html`], [`${l}/create.html`], [`${l}/guide/getting-started.html`]]),
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
  it.each([["guide/getting-started.html"], ...NON_JA_LOCALES.map((l) => [`${l}/guide/getting-started.html`])])(
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
    ...NON_JA_LOCALES.map((l) => [`${l}/guide`, [l, "guide"], true] as [string, string[], boolean]),
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

  it.each(NON_JA_LOCALES)("%s/guide/utm-setup.html が生成されていないこと", (l) => {
    // 対照: ja 側の utm-setup は生成されている（パスの組み立て違いで素通りしない）
    expect(fs.existsSync(path.join(BUILD_APP, "guide", "utm-setup.html"))).toBe(true);
    expect(fs.existsSync(path.join(BUILD_APP, l, "guide", "utm-setup.html"))).toBe(false);
  });

  // 意図（M2）: [locale] は ja を受けず、未知の slug も生成しない。/ja と /en/foo は静的 HTML にならない
  it.each(NON_JA_LOCALES)("ja.html と %s/foo.html が生成されていないこと", (l) => {
    // 対照: {locale}.html は生成されている（パスの組み立て違いで素通りしない）
    expect(fs.existsSync(path.join(BUILD_APP, `${l}.html`))).toBe(true);
    expect(fs.existsSync(path.join(BUILD_APP, "ja.html"))).toBe(false);
    expect(fs.existsSync(path.join(BUILD_APP, l, "foo.html"))).toBe(false);
  });

  // 意図（qr_code_create-01z.4）: en の文言が Client バンドル（.next/static）に入っていない。
  // en は getDict 経由で Server からだけ読まれ、Client へは RSC ペイロード（HTML 内）で渡る想定。
  // needle は辞書から導出し、Server スライス（hero の説明文）と Client スライス（ボタン・aria-label・ラベル）の両方を含める。
  // M9: es / pt-br / de は翻訳済みで、各言語の Server 側だけにある文言が言語固有の値になる。
  // 言語ごとに needle を分けて検査するので、どの言語の辞書が Client に混ざったかが分かる
  const NEEDLE_DICTS = { en, es, "pt-br": ptBr, de } as const;
  const serverNeedlesOf = (l: keyof typeof NEEDLE_DICTS): string[] => [
    NEEDLE_DICTS[l].home.hero.description,
    NEEDLE_DICTS[l].home.features.items[0].description,
    NEEDLE_DICTS[l].footer.japaneseOnlyNote,
    NEEDLE_DICTS[l].schema.howTo.name,
  ];
  const SERVER_NEEDLES = NON_JA_LOCALES.flatMap((l) => serverNeedlesOf(l));
  const CLIENT_NEEDLES = NON_JA_LOCALES.flatMap((l) => [
    NEEDLE_DICTS[l].tool.download.pngButton,
    NEEDLE_DICTS[l].tool.qrPreview.ariaGenerated,
    NEEDLE_DICTS[l].decoration.caption.textLabel,
  ]);

  // 意図: 対照。同じ文字列がサーバー出力の HTML には入っている（needle が正しく、空振りでない）
  it.each(NON_JA_LOCALES)("対照: %s の needle が .next/server/app の {locale}.html / {locale}/create.html に含まれること", (l) => {
    const d = NEEDLE_DICTS[l];
    const topHtml = fs.readFileSync(path.join(BUILD_APP, `${l}.html`), "utf8");
    const createHtml = fs.readFileSync(path.join(BUILD_APP, l, "create.html"), "utf8");
    expect(topHtml).toContain(d.home.hero.description);
    for (const n of [d.tool.download.pngButton, d.tool.qrPreview.ariaGenerated, d.decoration.caption.textLabel]) {
      expect(createHtml).toContain(n);
    }
  });

  // 意図（qr_code_create-01z.7、M4 で全言語へ）: 全言語が揃う 3 ページ x 5 言語の静的 HTML の head に hreflang が 6 本ずつ出ている。
  // React は属性を hrefLang と出すので、属性名の大文字小文字は無視して照合する
  const HREFLANG_KEYS = [...LOCALES.map((l) => LOCALE_CONFIG[l].hreflang), "x-default"].sort();
  const pathOf = (l: (typeof LOCALES)[number], jaPath: string): string => {
    const prefix = LOCALE_CONFIG[l].prefix;
    return jaPath === "/" ? prefix || "/" : `${prefix}${jaPath}`;
  };
  const fileOfPath = (pathname: string): string => {
    if (pathname === "/") return "index.html";
    return `${pathname.slice(1)}.html`;
  };
  const HREFLANG_PAGES = LOCALES.flatMap((self) =>
    TRANSLATED_PATHS.map((jaPath) => ({
      file: fileOfPath(pathOf(self, jaPath)),
      ja: pathOf("ja", jaPath),
      alternates: Object.fromEntries(LOCALES.map((l) => [LOCALE_CONFIG[l].hreflang, pathOf(l, jaPath)])),
    }))
  );
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

  it.each(HREFLANG_PAGES)("$file の head に hreflang が ja / en / es / pt-BR / de / x-default の 6 本", ({ file, ja, alternates }) => {
    const head = readHead(file);
    expect((head.match(/<link\b[^>]*\bhreflang="/gi) ?? []).length).toBe(6);
    expect(Object.keys(alternateLinks(head)).sort()).toEqual(HREFLANG_KEYS);
    expect(alternateLinks(head)).toEqual({ ...alternates, "x-default": ja });
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
    for (const l of NON_JA_LOCALES) {
      const prefix = LOCALE_CONFIG[l].prefix;
      expect(locs.filter((p) => p === prefix || p.startsWith(`${prefix}/`)).sort()).toEqual(
        [prefix, `${prefix}/create`, `${prefix}/guide/getting-started`].sort()
      );
    }
    // 15 エントリ（3 ページ x 5 言語）× 6 本
    expect((xml.match(/<xhtml:link rel="alternate" hreflang="/g) ?? []).length).toBe(90);
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  });

  // 意図: noindex の /privacy と /terms は sitemap に載らず、lastmod は記事（guide・use-cases・blog）にだけある
  it("sitemap.xml.body に /privacy・/terms の loc が無く、lastmod が記事にだけある", () => {
    const full = path.join(BUILD_APP, "sitemap.xml.body");
    if (!fs.existsSync(full)) {
      throw new Error(`${full} がありません。\`npm run build\` 後に実行してください。`);
    }
    const xml = fs.readFileSync(full, "utf8");
    const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => {
      const loc = m[1].match(/<loc>([^<]*)<\/loc>/);
      if (!loc) throw new Error(`<loc> の無い <url>: ${m[1]}`);
      const lastmod = m[1].match(/<lastmod>([^<]*)<\/lastmod>/);
      return { pathname: new URL(loc[1]).pathname, lastmod: lastmod ? lastmod[1] : null };
    });
    expect(entries.length).toBeGreaterThan(0);
    const pathnames = entries.map((e) => e.pathname);
    expect(pathnames).not.toContain("/privacy");
    expect(pathnames).not.toContain("/terms");
    const isArticle = (p: string) => /\/(guide|use-cases|blog)\/[^/]+$/.test(p);
    const articles = entries.filter((e) => isArticle(e.pathname));
    const fixed = entries.filter((e) => !isArticle(e.pathname));
    expect(articles.length).toBeGreaterThan(0);
    expect(fixed.length).toBeGreaterThan(0);
    for (const e of articles) expect(e.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}/);
    for (const e of fixed) expect({ path: e.pathname, lastmod: e.lastmod }).toEqual({ path: e.pathname, lastmod: null });
  });

  // 意図: sitemap の xhtml:link と HTML の hreflang が食い違わない。
  // sitemap を <url> 単位で解析し、xhtml:link を持つ 6 件それぞれで
  // (1) 自言語の xhtml:link が loc と一致、(2) 同じページの HTML の hreflang 3 本と一致（new URL().href で正規化）
  it("sitemap の xhtml:link を持つ 15 件が自言語で loc と一致し、HTML の hreflang 6 本とも一致する", () => {
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
      HREFLANG_PAGES.map((p) => [p.file === "index.html" ? "/" : `/${p.file.replace(/\.html$/, "")}`, p.file])
    );
    expect(entries.map((e) => new URL(e.loc).pathname).sort()).toEqual(Object.keys(fileOf).sort());

    for (const { loc, links } of entries) {
      const pathname = new URL(loc).pathname;
      const self =
        LOCALES.find((l) => l !== "ja" && (pathname === LOCALE_CONFIG[l].prefix || pathname.startsWith(`${LOCALE_CONFIG[l].prefix}/`))) ?? "ja";
      expect({ loc, keys: Object.keys(links).sort() }).toEqual({ loc, keys: HREFLANG_KEYS });
      expect({ loc, self: links[LOCALE_CONFIG[self].hreflang] }).toEqual({ loc, self: loc });

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

  // 意図（qr_code_create-79i）: llms.txt は route（force-static）から出力され、public/llms.txt は無い。
  // robots.txt には OAI-SearchBot が明示される
  describe("llms.txt と robots.txt", () => {
    const readBuilt = (file: string): string => {
      const full = path.join(BUILD_APP, file);
      if (!fs.existsSync(full)) {
        throw new Error(`${full} がありません。\`npm run build\` 後に実行してください。`);
      }
      return fs.readFileSync(full, "utf8");
    };

    it("llms.txt.body があり、.meta の content-type が text/plain であること", () => {
      expect(readBuilt("llms.txt.body").length).toBeGreaterThan(0);
      const meta = JSON.parse(readBuilt("llms.txt.meta")) as { headers?: Record<string, string> };
      expect(meta.headers?.["content-type"]).toMatch(/^text\/plain/);
    });

    it("llms.txt.body に各言語のトップ URL があり、古い文言が無いこと", () => {
      const body = readBuilt("llms.txt.body");
      const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";
      for (const l of NON_JA_LOCALES) expect(body).toContain(`(${site}${LOCALE_CONFIG[l].prefix})`);
      expect(body).not.toContain("All pages are written in Japanese");
      expect(body).not.toContain("## Overview");
      expect(body).not.toContain("## URL");
      expect(body).not.toContain("/privacy");
      expect(body).not.toContain("/terms");
    });

    it("robots.txt.body に User-Agent: OAI-SearchBot があること", () => {
      const body = readBuilt("robots.txt.body");
      expect(body).toMatch(/^User-Agent: OAI-SearchBot$/m);
      expect(body).toMatch(/^User-Agent: \*$/m);
      expect(body).toMatch(/^Allow: \/$/m);
    });

    it("public/llms.txt が無いこと（route に置き換わった）", () => {
      expect(fs.existsSync(path.join(ROOT, "public", "llms.txt"))).toBe(false);
    });
  });

  const staticFiles = (): string[] => {
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
    return walk(STATIC);
  };
  const hitsFor = (needles: string[]): string[] =>
    staticFiles().flatMap((file) => {
      const text = fs.readFileSync(file, "utf8");
      return needles.filter((n) => text.includes(n)).map((n) => `${path.relative(ROOT, file)}: ${n}`);
    });

  // 意図: 言語固有の needle が、言語の間で重ならず、en とも重ならない（区別して検出できる）
  it("Server 側の needle が言語ごとに固有で、互いに重ならないこと", () => {
    // NON_JA_LOCALES は en を含む（en / es / pt-br / de）
    expect(NON_JA_LOCALES).toContain("en");
    const all = NON_JA_LOCALES.flatMap((l) => serverNeedlesOf(l));
    expect(all.filter((n, i) => all.indexOf(n) !== i)).toEqual([]);
    for (const l of NON_JA_LOCALES.filter((x) => x !== "en")) {
      for (const n of serverNeedlesOf(l)) expect(serverNeedlesOf("en")).not.toContain(n);
    }
  });

  // 意図: 各言語の Server 辞書の文言が Client バンドル（.next/static）に入っていない。言語ごとに別の test にする
  it.each(NON_JA_LOCALES)("%s: .next/static に %s の Server 側の文言が無いこと", (l) => {
    expect(staticFiles().length).toBeGreaterThan(0);
    expect(hitsFor(serverNeedlesOf(l))).toEqual([]);
  });

  it.each(NON_JA_LOCALES)("%s: .next/static に %s の Client スライスの代表が無いこと", (l) => {
    const d = NEEDLE_DICTS[l];
    expect(hitsFor([d.tool.download.pngButton, d.tool.qrPreview.ariaGenerated, d.decoration.caption.textLabel])).toEqual([]);
  });

  // 異常系（検出の確認）: needle が実際に出力に入っていれば検出される。.next/server/app の HTML（Server 出力）を探索対象にして確かめる
  it("検出の確認: Server の出力 HTML には各言語の needle が含まれ、含まれる語は検出される", () => {
    for (const l of NON_JA_LOCALES) {
      const topHtml = fs.readFileSync(path.join(BUILD_APP, `${l}.html`), "utf8");
      expect(topHtml).toContain(NEEDLE_DICTS[l].home.hero.description);
      // 他言語の文言は含まれない（言語を取り違えていない）
      for (const other of NON_JA_LOCALES.filter((x) => x !== l)) {
        expect(topHtml).not.toContain(NEEDLE_DICTS[other].home.hero.description);
      }
    }
    expect(SERVER_NEEDLES.length).toBe(NON_JA_LOCALES.length * 4);
    expect(CLIENT_NEEDLES.length).toBeGreaterThan(0);
  });

  // 意図（qr_code_create-gx4）: トップは WebSite と Organization、/create は WebApplication の JSON-LD を出す。
  // 各 JSON-LD が JSON として壊れていないこと（JSON.parse できること）も確かめる
  type LdNode = { "@type": string; "@id"?: string; url?: string; inLanguage?: string; publisher?: { "@id": string } };
  const readJsonLd = (file: string): LdNode[] => {
    const full = path.join(BUILD_APP, ...file.split("/"));
    if (!fs.existsSync(full)) {
      throw new Error(`${full} がありません。\`npm run build\` 後に実行してください。`);
    }
    const html = fs.readFileSync(full, "utf8");
    const scripts = Array.from(
      html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
      (m) => m[1]
    );
    return scripts.map((s) => JSON.parse(s) as LdNode);
  };
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";
  type PageCase = [string, (typeof LOCALES)[number]];
  const TOP_FILES: PageCase[] = LOCALES.map((l) => [l === "ja" ? "index.html" : `${l}.html`, l]);
  const CREATE_FILES: PageCase[] = LOCALES.map((l) => [l === "ja" ? "create.html" : `${l}/create.html`, l]);
  const countOf = (nodes: LdNode[], type: string) => nodes.filter((n) => n["@type"] === type).length;

  it.each(TOP_FILES)("%s の JSON-LD に WebSite と Organization が 1 件ずつあり WebApplication が無いこと", (file) => {
    const nodes = readJsonLd(file);
    expect(countOf(nodes, "WebSite")).toBe(1);
    expect(countOf(nodes, "Organization")).toBe(1);
    expect(countOf(nodes, "WebApplication")).toBe(0);
  });

  it.each(TOP_FILES)("%s の WebSite が自言語の url と inLanguage を持つこと", (file, l) => {
    const site = readJsonLd(file).find((n) => n["@type"] === "WebSite");
    expect(site?.url).toBe(`${SITE}${localePath(l, "/")}`);
    expect(site?.inLanguage).toBe(LOCALE_CONFIG[l].htmlLang);
  });

  it.each(TOP_FILES)("%s の WebSite.publisher.@id と Organization.@id が一致すること", (file) => {
    const nodes = readJsonLd(file);
    const site = nodes.find((n) => n["@type"] === "WebSite");
    const org = nodes.find((n) => n["@type"] === "Organization");
    expect(org?.["@id"]).toBeTruthy();
    expect(site?.publisher?.["@id"]).toBe(org?.["@id"]);
  });

  it.each(CREATE_FILES)("%s の JSON-LD に WebApplication が 1 件あり WebSite と Organization が無いこと", (file) => {
    const nodes = readJsonLd(file);
    expect(countOf(nodes, "WebApplication")).toBe(1);
    expect(countOf(nodes, "WebSite")).toBe(0);
    expect(countOf(nodes, "Organization")).toBe(0);
  });

  it.each(CREATE_FILES)("%s の WebApplication が自言語の url と inLanguage を持つこと", (file, l) => {
    const app = readJsonLd(file).find((n) => n["@type"] === "WebApplication");
    expect(app?.url).toBe(`${SITE}${localePath(l, "/create")}`);
    expect(app?.inLanguage).toBe(LOCALE_CONFIG[l].htmlLang);
  });

  // 意図（qr_code_create-cwq）: 記事の og:type は article で公開日・更新日が付き、BlogPosting に image と dateModified がある。
  // dateModified は updated ?? date（en・de の getting-started は updated の 2026-10-28）。トップと /create は website
  const readHtml = (file: string): string => {
    const full = path.join(BUILD_APP, ...file.split("/"));
    if (!fs.existsSync(full)) {
      throw new Error(`${full} がありません。\`npm run build\` 後に実行してください。`);
    }
    return fs.readFileSync(full, "utf8");
  };
  const metaContent = (html: string, property: string): string | undefined =>
    html.match(new RegExp(`<meta property="${property}" content="([^"]*)"`))?.[1];
  const firstSlug = (dir: string): string => {
    const files = fs.readdirSync(path.join(ROOT, "src", "content", dir)).filter((f) => f.endsWith(".mdx")).sort();
    return files[0].replace(/\.mdx$/, "");
  };
  const ARTICLE_CASES: [string, string][] = [
    ["guide/getting-started.html", "2026-04-17"],
    ["guide/utm-setup.html", "2026-04-17"],
    [`use-cases/${firstSlug("use-cases")}.html`, ""],
    [`blog/${firstSlug("blog")}.html`, ""],
    ...NON_JA_LOCALES.map((l): [string, string] => [`${l}/guide/getting-started.html`, "2026-10-28"]),
  ];

  it.each(ARTICLE_CASES)("%s の og:type が article で、published_time と modified_time があること", (file, modified) => {
    const html = readHtml(file);
    expect(metaContent(html, "og:type")).toBe("article");
    expect(metaContent(html, "article:published_time")).toMatch(/^\d{4}-\d{2}-\d{2}/);
    const mod = metaContent(html, "article:modified_time");
    expect(mod).toMatch(/^\d{4}-\d{2}-\d{2}/);
    if (modified) expect(mod).toBe(modified);
  });

  it.each(ARTICLE_CASES)("%s の BlogPosting に image と dateModified があること", (file, modified) => {
    const posting = readJsonLd(file).find((n) => n["@type"] === "BlogPosting") as
      | (LdNode & { image?: string; dateModified?: string; datePublished?: string; author?: { "@id"?: string; url?: string } })
      | undefined;
    expect(posting).toBeDefined();
    expect(posting?.image).toBe(`${SITE}/images/og/default.png`);
    expect(posting?.author?.["@id"]).toBe(`${SITE}/#organization`);
    expect(posting?.author?.url).toBe(SITE);
    expect(posting?.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}/);
    if (modified) expect(posting?.dateModified).toBe(modified);
    else expect(posting?.dateModified).toBe(posting?.datePublished);
  });

  it.each([
    "index.html",
    "create.html",
    "faq.html",
    "guide.html",
    "use-cases.html",
    "blog.html",
    ...NON_JA_LOCALES.flatMap((l) => [`${l}.html`, `${l}/create.html`]),
  ])("%s の og:type が website で、article の日付が無いこと", (file) => {
    const html = readHtml(file);
    expect(metaContent(html, "og:type")).toBe("website");
    expect(metaContent(html, "article:modified_time")).toBeUndefined();
    expect(metaContent(html, "article:published_time")).toBeUndefined();
  });

  // use-cases と blog は全 slug で、article・updated なし（dateModified === datePublished）・modified_time === published_time
  it.each(["use-cases", "blog"])("%s の全記事が article で、更新日が公開日と一致すること", (dir) => {
    const slugs = fs
      .readdirSync(path.join(ROOT, "src", "content", dir))
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.replace(/\.mdx$/, ""));
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      const file = `${dir}/${slug}.html`;
      const html = readHtml(file); // 無ければ fail
      expect({ file, type: metaContent(html, "og:type") }).toEqual({ file, type: "article" });
      const published = metaContent(html, "article:published_time");
      expect(published).toMatch(/^\d{4}-\d{2}-\d{2}/);
      expect({ file, modified: metaContent(html, "article:modified_time") }).toEqual({ file, modified: published });
      const posting = readJsonLd(file).find((n) => n["@type"] === "BlogPosting") as
        | (LdNode & { dateModified?: string; datePublished?: string })
        | undefined;
      expect(posting?.datePublished).toBeDefined();
      expect({ file, dateModified: posting?.dateModified }).toEqual({ file, dateModified: posting?.datePublished });
    }
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
    ...listFiles(path.join(APP, "[locale]")),
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
