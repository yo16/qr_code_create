import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { test, expect, type Page } from "@playwright/test";
import { LOCALES, NON_JA_LOCALES } from "../../src/i18n/locales";
import { LOCALE_CONFIG } from "../../src/lib/i18n/localeConfig";
import { localePath } from "../../src/lib/i18n/routes";
import { es } from "../../src/i18n/es";
import { ptBr } from "../../src/i18n/ptBr";
import { de } from "../../src/i18n/de";
import type { Dict } from "../../src/i18n/types";

/**
 * es / pt-br / de の 3 ページ（トップ・作成・ガイド）x 3 言語 = 9 URL の受け入れ（qr_code_create-38x.9）。
 * 設計: doc/design/i18n-multi.md 2.3 節・11.3 節
 *
 * - 200、html lang、title（辞書の値でサイト名が 1 回）、h1、hreflang 6 本と canonical の自己参照、og:locale
 * - 日本語が混ざらない
 * - /create でダウンロードボタンが押せる状態になり PNG を 1 回ダウンロードできる
 * - 390px / 820px で横スクロールが出ず、ヘッダーが 1 行に収まる
 *
 * 本番ビルドで流す（npm run build のあと npm run test:e2e:prod）。
 */

test.setTimeout(120_000);
const NAV_TIMEOUT = 90_000;

type Target = (typeof NON_JA_LOCALES)[number];
type PageKind = "home" | "create" | "guide";

const DICTS: Record<Target, Dict> = { es, "pt-br": ptBr, de };
const TARGETS = (["es", "pt-br", "de"] as const).filter((l): l is Target => NON_JA_LOCALES.includes(l));
const KINDS: readonly { kind: PageKind; jaPath: string }[] = [
  { kind: "home", jaPath: "/" },
  { kind: "create", jaPath: "/create" },
  { kind: "guide", jaPath: "/guide/getting-started" },
];

const SITE_NAME = "QR Code Create";
const JAPANESE = /[぀-ゟ゠-ヿ一-鿿]/;
const EXPECTED_HREFLANGS = [...LOCALES.map((l) => LOCALE_CONFIG[l].hreflang), "x-default"].sort();

const norm = (s: string): string => s.replace(/\s+/g, " ").trim();
const pathOf = (href: string | null): string => new URL(href ?? "", "http://invalid.invalid").pathname;

/** ガイドの MDX の title（ガイドの h1 とメタデータはここから来る） */
function guideTitle(locale: Target): string {
  const file = path.join(process.cwd(), "src", "content", locale, "guide", "getting-started.mdx");
  return String(matter(fs.readFileSync(file, "utf8")).data.title ?? "");
}

function expectedH1(locale: Target, kind: PageKind): string {
  const d = DICTS[locale];
  if (kind === "home") return norm(`${d.home.hero.headingLine1}${d.home.hero.headingLine2}`);
  if (kind === "create") return norm(d.tool.pageHeading);
  return norm(guideTitle(locale));
}

function expectedTitle(locale: Target, kind: PageKind): string {
  const d = DICTS[locale];
  if (kind === "home") return d.meta.pages.home.title;
  if (kind === "create") return d.meta.pages.create.title;
  return guideTitle(locale);
}

/** 切り替えの「日本語」と、画面の内容に含まれない日本語の行を除いて、日本語を含む行を返す */
async function japaneseLines(page: Page): Promise<string[]> {
  const text = await page.locator("body").innerText();
  return text
    .split("\n")
    .filter((line) => line.trim() !== LOCALE_CONFIG.ja.nativeName)
    .filter((line) => JAPANESE.test(line));
}

async function horizontalOverflow(page: Page): Promise<{ scrollWidth: number; clientWidth: number }> {
  return page.evaluate(() => {
    const el = document.scrollingElement as Element;
    return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
  });
}

test.describe("9 ページの描画と head", () => {
  for (const locale of TARGETS) {
    for (const { kind, jaPath } of KINDS) {
      const self = localePath(locale, jaPath);
      const cfg = LOCALE_CONFIG[locale];

      test(`${self}: 200、html lang、title、h1、日本語なし`, async ({ page }) => {
        const response = await page.goto(self, { timeout: NAV_TIMEOUT });
        expect(response?.status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", cfg.htmlLang);

        const title = await page.title();
        expect(title).toContain(expectedTitle(locale, kind));
        expect(title.split(SITE_NAME)).toHaveLength(2); // サイト名がちょうど 1 回

        const h1 = page.locator("h1");
        await expect(h1).toHaveCount(1);
        expect(norm(await h1.innerText())).toBe(expectedH1(locale, kind));

        expect(await japaneseLines(page)).toEqual([]);
        expect(JAPANESE.test(title)).toBe(false);
      });

      test(`${self}: hreflang 6 本、canonical 自己参照、og:locale`, async ({ page }) => {
        await page.goto(self, { timeout: NAV_TIMEOUT });
        const links = await page
          .locator("head link[rel=alternate][hreflang]")
          .evaluateAll((els) => els.map((el) => ({ hreflang: el.getAttribute("hreflang"), href: el.getAttribute("href") })));
        expect(links).toHaveLength(6);
        const byLang = Object.fromEntries(links.map((l) => [l.hreflang, l.href]));
        expect(Object.keys(byLang).sort()).toEqual(EXPECTED_HREFLANGS);
        for (const l of LOCALES) {
          expect(pathOf(byLang[LOCALE_CONFIG[l].hreflang] ?? null)).toBe(localePath(l, jaPath));
        }
        expect(pathOf(byLang["x-default"] ?? null)).toBe(jaPath);

        const canonical = await page.locator('head link[rel="canonical"]').getAttribute("href");
        expect(pathOf(canonical)).toBe(self);
        expect(canonical).toBe(byLang[cfg.hreflang]);

        await expect(page.locator('head meta[property="og:locale"]')).toHaveAttribute("content", cfg.ogLocale);
      });
    }
  }

  // 対照（異常系）: 判定が素通りしないよう、日本語のページでは検出される
  test("対照: ja のトップでは日本語の行が検出され、title は辞書の値と一致しない", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    expect((await japaneseLines(page)).length).toBeGreaterThan(0);
    expect(await page.title()).not.toContain(es.meta.pages.home.title);
  });
});

test.describe("/create のダウンロード", () => {
  for (const locale of TARGETS) {
    const self = localePath(locale, "/create");
    // 意図: URL を入れるとプレビューが出てボタンが押せる状態になり、PNG が 1 回ダウンロードできる
    test(`${self}: URL 入力 → ダウンロードボタンが有効 → PNG を 1 回ダウンロード`, async ({ page }) => {
      const d = DICTS[locale];
      await page.goto(self, { timeout: NAV_TIMEOUT });
      await page.getByPlaceholder("https://example.com").first().fill("https://example.com");
      await expect(page.getByLabel(d.tool.qrPreview.ariaGenerated)).toBeVisible({ timeout: 30_000 });

      const png = page.getByRole("button", { name: d.tool.download.pngButton });
      await expect(png).toBeEnabled();
      const [download] = await Promise.all([page.waitForEvent("download", { timeout: 30_000 }), png.click()]);
      expect(download.suggestedFilename()).toMatch(/\.png$/);
    });
  }

  // 異常系: URL が空のときはプレビューが出ず、ダウンロードボタンは押せない
  test("URL が空の /de/create ではダウンロードボタンが出ない", async ({ page }) => {
    await page.goto("/de/create", { timeout: NAV_TIMEOUT });
    await expect(page.getByLabel(de.tool.qrPreview.ariaGenerated)).toHaveCount(0);
    const png = page.getByRole("button", { name: de.tool.download.pngButton });
    // URL が空のときはボタン自体が描かれない（実測）。押せる状態にならないことを直接確かめる
    await expect(png).toHaveCount(0);
    // 対照: URL を入れるとボタンが現れて有効になる
    await page.getByPlaceholder("https://example.com").first().fill("https://example.com");
    await expect(png).toBeEnabled({ timeout: 30_000 });
  });

  // 意図: SVG / PDF も押せてファイル名の拡張子が正しい（PDF は de だけ。es / pt-br は SVG を 1 回）
  const FORMATS = [
    { locale: "de", ext: ".svg", pick: (d: Dict) => d.tool.download.svgButton },
    { locale: "de", ext: ".pdf", pick: (d: Dict) => d.tool.download.pdfButton },
    { locale: "es", ext: ".svg", pick: (d: Dict) => d.tool.download.svgButton },
    { locale: "pt-br", ext: ".svg", pick: (d: Dict) => d.tool.download.svgButton },
  ] as const;
  for (const { locale, ext, pick } of FORMATS) {
    test(`${localePath(locale, "/create")}: ${ext} をダウンロードできる`, async ({ page }) => {
      const d = DICTS[locale];
      await page.goto(localePath(locale, "/create"), { timeout: NAV_TIMEOUT });
      await page.getByPlaceholder("https://example.com").first().fill("https://example.com");
      await expect(page.getByLabel(d.tool.qrPreview.ariaGenerated)).toBeVisible({ timeout: 30_000 });
      const button = page.getByRole("button", { name: pick(d) });
      await expect(button).toBeEnabled();
      const [download] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), button.click()]);
      expect(download.suggestedFilename().endsWith(ext)).toBe(true);
    });
  }
});

test.describe("レイアウト（横スクロール・ヘッダー）", () => {
  const WIDTHS = [390, 820] as const;

  for (const width of WIDTHS) {
    test.describe(`${width}px`, () => {
      test.use({ viewport: { width, height: 844 } });

      for (const locale of TARGETS) {
        for (const { jaPath } of KINDS) {
          const self = localePath(locale, jaPath);
          test(`${self}: 横スクロールが出ない`, async ({ page }) => {
            await page.goto(self, { timeout: NAV_TIMEOUT });
            const o = await horizontalOverflow(page);
            expect(o.scrollWidth).toBeLessThanOrEqual(o.clientWidth);
          });
        }
      }

      // 回帰: pt-br の /create は UTM 欄の評価表示（Nível de acompanhamento）ではみ出していた
      for (const locale of TARGETS) {
        const self = localePath(locale, "/create");
        test(`${self}: URL と UTM を入力した状態でも横スクロールが出ない`, async ({ page }) => {
          const d = DICTS[locale];
          await page.goto(self, { timeout: NAV_TIMEOUT });
          await page.getByPlaceholder("https://example.com").first().fill("https://example.com");
          await expect(page.getByLabel(d.tool.qrPreview.ariaGenerated)).toBeVisible({ timeout: 30_000 });
          const campaign = page.getByPlaceholder(d.utm.fieldPlaceholders.campaign);
          await expect(campaign).toBeVisible();
          await campaign.fill("campaign_2026");
          // source / medium も入れる（ラベルは辞書の値。入力欄が textbox / combobox のどちらでも対応する）
          for (const label of [d.utm.fieldLabels.source, d.utm.fieldLabels.medium]) {
            const field = page.getByLabel(label, { exact: true }).first();
            await expect(field).toBeVisible();
            // source / medium は select のことがある。select なら最後の選択肢、入力欄なら文字を入れる
            if (await field.evaluate((el) => el.tagName === "SELECT")) {
              const values = await field.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
              await field.selectOption(values[values.length - 1]);
            } else {
              await field.fill("qr_test");
            }
          }
          const o = await horizontalOverflow(page);
          expect(o.scrollWidth).toBeLessThanOrEqual(o.clientWidth);
        });
      }
    });
  }

  test.describe("390px のヘッダー", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    for (const locale of TARGETS) {
      for (const { jaPath } of KINDS) {
        const self = localePath(locale, jaPath);
        // 意図: ロゴ・切り替え・メニューボタンが 1 行に並び、ヘッダーの内側に収まる
        test(`${self}: ヘッダーが 1 行に収まる`, async ({ page }) => {
          await page.goto(self, { timeout: NAV_TIMEOUT });
          const header = page.locator("header").first();
          const logo = header.getByRole("link", { name: new RegExp(SITE_NAME) });
          const button = page.locator("header button:has(+ ul)");
          const menu = header.locator("button[aria-expanded]:not(:has(+ ul))");
          await expect(button).toBeVisible();
          await expect(menu).toBeVisible();

          const headerBox = (await header.boundingBox()) as NonNullable<Awaited<ReturnType<typeof header.boundingBox>>>;
          const boxes = {
            logo: (await logo.boundingBox()) as typeof headerBox,
            button: (await button.boundingBox()) as typeof headerBox,
            menu: (await menu.boundingBox()) as typeof headerBox,
          };
          const centers = Object.values(boxes).map((b) => b.y + b.height / 2);
          expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(8);
          for (const [name, b] of Object.entries(boxes)) {
            expect.soft(b.x, `${name} left`).toBeGreaterThanOrEqual(headerBox.x - 0.5);
            expect.soft(b.x + b.width, `${name} right`).toBeLessThanOrEqual(headerBox.x + headerBox.width + 0.5);
            expect.soft(b.y + b.height, `${name} bottom`).toBeLessThanOrEqual(headerBox.y + headerBox.height + 0.5);
          }
        });
      }
    }
  });

  test.describe("390px の要素内の文字", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    for (const locale of TARGETS) {
      for (const { jaPath } of KINDS) {
        const self = localePath(locale, jaPath);
        // 意図: header と main 内の表示中の button / a で、文字が要素の外へはみ出さない
        test(`${self}: header と main の button / a で scrollWidth <= clientWidth + 1`, async ({ page }) => {
          await page.goto(self, { timeout: NAV_TIMEOUT });
          const result = await page.evaluate(() => {
            const els = Array.from(document.querySelectorAll("header button, header a, main button, main a"));
            const visible = els.filter((el) => {
              const r = el.getBoundingClientRect();
              const s = getComputedStyle(el);
              return r.width > 0 && r.height > 0 && s.visibility !== "hidden";
            });
            // インライン要素（本文中のリンク）は clientWidth が 0 になるので、ブロック系だけを対象にする
            const measured = visible.filter((el) => getComputedStyle(el).display !== "inline");
            const bad = measured
              .filter((el) => el.scrollWidth > el.clientWidth + 1)
              .map((el) => `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 40)}" ${el.scrollWidth}>${el.clientWidth}`);
            return { checked: visible.length, measured: measured.length, bad };
          });
          expect(result.measured).toBeGreaterThanOrEqual(1); // inline を除いたあとも検査対象がある
          expect(result.checked).toBeGreaterThanOrEqual(3); // 空振り防止（ロゴ・切り替え・メニューボタンは必ずある）
          expect(result.bad).toEqual([]);
        });
      }
    }

    for (const locale of TARGETS) {
      const self = localePath(locale, "/");
      // 意図: メニューを開くと、ナビ項目と CTA がパネルの内側に収まり、文字がはみ出さない
      test(`${self}: メニューを開いたパネルの項目と CTA がパネルの内側に収まる`, async ({ page }) => {
        await page.goto(self, { timeout: NAV_TIMEOUT });
        const menu = page.locator("header button[aria-expanded]:not(:has(+ ul))");
        await expect(async () => {
          if ((await menu.getAttribute("aria-expanded")) !== "true") await menu.click();
          await expect(menu).toHaveAttribute("aria-expanded", "true", { timeout: 1000 });
        }).toPass({ timeout: 15_000 });

        const panel = menu.locator("xpath=following-sibling::nav");
        await expect(panel).toBeVisible();
        const panelBox = (await panel.boundingBox()) as NonNullable<Awaited<ReturnType<typeof panel.boundingBox>>>;
        expect(panelBox.x).toBeGreaterThanOrEqual(-0.5);
        expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(390.5);

        const items = panel.locator("a");
        const count = await items.count();
        expect(count).toBeGreaterThanOrEqual(2); // ナビ項目 + CTA
        for (let i = 0; i < count; i++) {
          const item = items.nth(i);
          const b = (await item.boundingBox()) as typeof panelBox;
          expect.soft(b.x, `item ${i} left`).toBeGreaterThanOrEqual(panelBox.x - 0.5);
          expect.soft(b.x + b.width, `item ${i} right`).toBeLessThanOrEqual(panelBox.x + panelBox.width + 0.5);
          const sizes = await item.evaluate((el) => ({ s: el.scrollWidth, c: el.clientWidth }));
          expect.soft(sizes.s, `item ${i} text`).toBeLessThanOrEqual(sizes.c + 1);
        }
        const o = await horizontalOverflow(page);
        expect(o.scrollWidth).toBeLessThanOrEqual(o.clientWidth);
      });
    }
  });
});
