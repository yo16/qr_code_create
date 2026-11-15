import { test, expect } from "@playwright/test";

/**
 * 記事の表の枠線と、スマホ幅でのはみ出し（qr_code_create-ttm）。
 * `npm run build` のあと `npm run test:e2e:prod`（本番ビルド、ポート 3100）で流す。
 */

const PAGES = [
  "/guide/utm-parameters",
  "/guide/utm-setup",
  "/use-cases/poster",
  "/blog/nenga-qr-utm-tracking",
];
const NAV_TIMEOUT = 90_000;
const BORDER_COLOR = "rgb(127, 139, 150)";

for (const width of [1280, 390]) {
  test.describe(`${width}px 幅の表の枠線`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
    });

    for (const url of PAGES) {
      test(`${url}: th と td の枠線が 1px 以上・solid・${BORDER_COLOR}`, async ({ page }) => {
        const res = await page.goto(url, { timeout: NAV_TIMEOUT });
        expect(res?.status()).toBe(200);
        const cells = await page.evaluate(() =>
          Array.from(document.querySelectorAll("article table th, article table td")).map((el) => {
            const s = getComputedStyle(el);
            const sides = ["Top", "Right", "Bottom", "Left"] as const;
            return sides.map((side) => ({
              side,
              width: parseFloat(s.getPropertyValue(`border-${side.toLowerCase()}-width`)),
              style: s.getPropertyValue(`border-${side.toLowerCase()}-style`),
              color: s.getPropertyValue(`border-${side.toLowerCase()}-color`),
            }));
          })
        );
        expect(cells.length).toBeGreaterThan(0);
        for (const sides of cells) {
          for (const b of sides) {
            expect(b.width).toBeGreaterThanOrEqual(1);
            expect(b.style).toBe("solid");
            expect(b.color).toBe(BORDER_COLOR);
          }
        }
      });
    }
  });
}

test.describe("390px 幅でのはみ出し", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  for (const url of PAGES) {
    test(`${url}: 横スクロールがなく、body・main・表が viewport 内`, async ({ page }) => {
      await page.goto(url, { timeout: NAV_TIMEOUT });
      const m = await page.evaluate(() => {
        const iw = window.innerWidth;
        const right = (el: Element | null) => (el ? el.getBoundingClientRect().right : 0);
        return {
          iw,
          sw: document.documentElement.scrollWidth,
          cw: document.documentElement.clientWidth,
          bsw: document.body.scrollWidth,
          bodyRight: right(document.body),
          mainRight: right(document.querySelector("main")),
          tables: Array.from(document.querySelectorAll("article table")).map((t) => right(t)),
        };
      });
      expect(m.sw).toBeLessThanOrEqual(m.cw);
      expect(m.bsw).toBeLessThanOrEqual(m.cw);
      expect(m.bodyRight).toBeLessThanOrEqual(m.iw);
      expect(m.mainRight).toBeLessThanOrEqual(m.iw);
      expect(m.tables.length).toBeGreaterThan(0);
      for (const r of m.tables) expect(r).toBeLessThanOrEqual(m.iw);
    });
  }
});

test.describe("1280px 幅で表が本文の幅いっぱい", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  for (const url of PAGES) {
    test(`${url}: 表の幅が本文の幅と等しい`, async ({ page }) => {
      await page.goto(url, { timeout: NAV_TIMEOUT });
      const m = await page.evaluate(() => {
        const content = document.querySelector("article table")?.parentElement;
        const tables = Array.from(document.querySelectorAll("article table")).map(
          (t) => t.getBoundingClientRect().width
        );
        const cs = content ? getComputedStyle(content) : null;
        const contentWidth = content
          ? content.getBoundingClientRect().width -
            parseFloat(cs!.paddingLeft) -
            parseFloat(cs!.paddingRight)
          : 0;
        return { tables, contentWidth };
      });
      expect(m.tables.length).toBeGreaterThan(0);
      for (const w of m.tables) expect(Math.abs(w - m.contentWidth)).toBeLessThanOrEqual(1);
    });
  }
});
