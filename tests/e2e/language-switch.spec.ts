import { test, expect, type Page } from "@playwright/test";
import { openList, switchButton, switchList } from "./helpers/languageSwitch";

/**
 * 言語切り替え（disclosure）の E2E（qr_code_create-38x.5）。
 * 設計: doc/design/i18n-multi.md 8 節
 *
 * - ボタンで一覧を開き、リンクで言語を選ぶ
 * - 5 言語（ja / en / es / pt-br / de）の往復、キーボード操作、390px での収まり
 *
 * 実行例（dev サーバーを 3100 で起動している場合）:
 *   npx playwright test --config tmp/playwright.dev3100.config.ts tests/e2e/language-switch.spec.ts
 */

test.setTimeout(120_000);
const NAV_TIMEOUT = 90_000;

type Lang = { prefix: "" | "/en" | "/es" | "/pt-br" | "/de"; hreflang: string; htmlLang: string; name: string };

const JA: Lang = { prefix: "", hreflang: "ja", htmlLang: "ja", name: "日本語" };
const EN: Lang = { prefix: "/en", hreflang: "en", htmlLang: "en", name: "English" };
const ES: Lang = { prefix: "/es", hreflang: "es", htmlLang: "es", name: "Español" };
const PT: Lang = { prefix: "/pt-br", hreflang: "pt-BR", htmlLang: "pt-BR", name: "Português (Brasil)" };
const DE: Lang = { prefix: "/de", hreflang: "de", htmlLang: "de", name: "Deutsch" };
const ALL: readonly Lang[] = [JA, EN, ES, PT, DE];

/** ja 側のパスを言語のパスにする */
function pathFor(lang: Lang, jaPath: string): string {
  if (lang.prefix === "") return jaPath;
  return jaPath === "/" ? lang.prefix : `${lang.prefix}${jaPath}`;
}

function switchLinkFor(page: Page, lang: Lang) {
  return switchList(page).locator(`a[hreflang="${lang.hreflang}"]`);
}

/** ボタンにフォーカスがある状態でキーを押して開く（ハイドレーション前の入力が失われても繰り返す） */
async function openByKey(page: Page, key: "Enter" | "Space") {
  const button = switchButton(page);
  await expect(async () => {
    if ((await button.getAttribute("aria-expanded")) !== "true") await page.keyboard.press(key);
    await expect(button).toHaveAttribute("aria-expanded", "true", { timeout: 1000 });
  }).toPass({ timeout: 15_000 });
}

/** 一覧を開いて lang のリンクを選び、行き先のパス・クエリ・html[lang] を確かめる */
async function selectLang(page: Page, lang: Lang, expectedPath: string) {
  await openList(page);
  await Promise.all([
    page.waitForURL((url) => url.pathname === expectedPath, { timeout: NAV_TIMEOUT }),
    switchLinkFor(page, lang).click(),
  ]);
  const url = new URL(page.url());
  expect(url.pathname).toBe(expectedPath);
  expect(url.search).toBe("");
  expect(url.hash).toBe("");
  await expect(page.locator("html")).toHaveAttribute("lang", lang.htmlLang);
}

test.describe("5 言語の往復", () => {
  // 意図: ja → en → es → pt-br → de → ja と全言語を巡って、各ページの URL と html lang が正しい
  for (const jaPath of ["/", "/create", "/guide/getting-started"]) {
    test(`${jaPath}: ja → en → es → pt-br → de → ja`, async ({ page }) => {
      await page.goto(jaPath, { timeout: NAV_TIMEOUT });
      await expect(page.locator("html")).toHaveAttribute("lang", "ja");
      for (const lang of [EN, ES, PT, DE, JA]) {
        await selectLang(page, lang, pathFor(lang, jaPath));
      }
    });
  }

  // 意図: 翻訳ページの無い URL では各言語のトップへ
  for (const lang of [EN, ES, PT, DE]) {
    test(`/faq（翻訳ページ無し）から ${lang.name} を選ぶと ${lang.prefix} へ`, async ({ page }) => {
      await page.goto("/faq", { timeout: NAV_TIMEOUT });
      await selectLang(page, lang, lang.prefix);
    });
  }

  // 意図: 他言語から ja へ戻ると、対応する ja ページ（無ければトップ）へ
  test("/de/create から ja を選ぶと /create、en を選ぶと /en/create", async ({ page }) => {
    await page.goto("/de/create", { timeout: NAV_TIMEOUT });
    await selectLang(page, EN, "/en/create");
    await selectLang(page, JA, "/create");
  });

  // 意図: クエリは引き継がない
  test("/create?utm_source=x で es を選ぶと /es/create（クエリなし）", async ({ page }) => {
    await page.goto("/create?utm_source=x", { timeout: NAV_TIMEOUT });
    await openList(page);
    await expect(switchLinkFor(page, ES)).toHaveAttribute("href", "/es/create");
    await selectLang(page, ES, "/es/create");
  });
});

test.describe("一覧の内容と状態", () => {
  // 意図: 一覧は LOCALES の順に 5 言語、自称、hreflang と lang が行き先の言語
  test("開くと 5 言語が自称で並び、hreflang / lang が各言語", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    await expect(switchButton(page)).toHaveAttribute("aria-expanded", "false");
    await expect(switchList(page)).toBeHidden();
    await openList(page);
    const links = switchList(page).locator("a");
    await expect(links).toHaveText(ALL.map((l) => l.name));
    for (const lang of ALL) {
      await expect(switchLinkFor(page, lang)).toHaveAttribute("lang", lang.htmlLang);
    }
  });

  // 意図: 今の言語のリンクだけに aria-current="true"
  for (const lang of ALL) {
    test(`${pathFor(lang, "/")}: 今の言語（${lang.name}）だけに aria-current="true"`, async ({ page }) => {
      await page.goto(pathFor(lang, "/"), { timeout: NAV_TIMEOUT });
      await openList(page);
      await expect(switchList(page).locator('a[aria-current="true"]')).toHaveCount(1);
      await expect(switchLinkFor(page, lang)).toHaveAttribute("aria-current", "true");
    });
  }

  test("ボタンの読み上げ名は ja で「言語（Language）: 日本語」、en で「Language: English」", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    await expect(switchButton(page)).toHaveAccessibleName("言語（Language）: 日本語");
    await page.goto("/en", { timeout: NAV_TIMEOUT });
    await expect(switchButton(page)).toHaveAccessibleName("Language: English");
  });

  test("ボタンの再クリック・外側のクリックで閉じる", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    const button = switchButton(page);
    await openList(page);
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(switchList(page)).toBeHidden();
    await openList(page);
    // ヘッダーの外（ページ左下付近）をクリックする
    await page.mouse.click(5, 500);
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("キーボード操作", () => {
  /** Tab を繰り返してボタンにフォーカスする */
  async function tabToButton(page: Page) {
    const button = switchButton(page);
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      if (await button.evaluate((el) => el === document.activeElement)) return;
    }
    throw new Error("Tab でボタンに届かなかった");
  }

  async function activeHreflang(page: Page): Promise<string | null> {
    return page.evaluate(() => (document.activeElement as HTMLElement | null)?.getAttribute("hreflang") ?? null);
  }

  // 意図: Tab でボタン → Enter で開く（フォーカスはボタンに残る）→ Tab で一覧のリンク → Esc で閉じてボタンへ戻る
  test("Tab・Enter で開き、Tab で一覧へ進み、Esc で閉じてボタンにフォーカスが戻る", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    const button = switchButton(page);
    await tabToButton(page);
    await expect(button).toBeFocused();
    await openByKey(page, "Enter");
    await expect(button).toBeFocused();

    await page.keyboard.press("Tab");
    expect(await activeHreflang(page)).toBe("ja");
    await page.keyboard.press("Tab");
    expect(await activeHreflang(page)).toBe("en");

    await page.keyboard.press("Escape");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(switchList(page)).toBeHidden();
    await expect(button).toBeFocused();
  });

  // 意図: ボタンにフォーカスがあるときの Esc でも閉じる
  test("ボタンにフォーカスがあるときの Esc でも閉じる", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    const button = switchButton(page);
    await tabToButton(page);
    await openByKey(page, "Space");
    await page.keyboard.press("Escape");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toBeFocused();
  });

  // 意図: 一覧のリンクで Enter を押すとその言語のページへ移る
  test("Tab で一覧の es のリンクへ進み、Enter で /es へ遷移する", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    await tabToButton(page);
    await openByKey(page, "Enter");
    // ja → en → es
    for (let i = 0; i < 3; i++) await page.keyboard.press("Tab");
    expect(await activeHreflang(page)).toBe("es");
    await Promise.all([
      page.waitForURL((url) => url.pathname === "/es", { timeout: NAV_TIMEOUT }),
      page.keyboard.press("Enter"),
    ]);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  });

  // 意図: 一覧の最後のリンクから Tab で出ると閉じる
  test("一覧の最後のリンクから Tab で外へ出ると閉じる", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    const button = switchButton(page);
    await tabToButton(page);
    await openByKey(page, "Enter");
    for (let i = 0; i < 5; i++) await page.keyboard.press("Tab");
    expect(await activeHreflang(page)).toBe("de");
    await page.keyboard.press("Tab");
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("404 のページ", () => {
  // 意図: 接頭辞配下の未定義 URL は ja のシェル（global-not-found）などで描かれる。
  // どちらのシェルでも、一覧のどのリンクも自分自身を指さず、接頭辞の言語を選ぶと 200 のトップへ移る
  for (const [path, lang] of [
    ["/en/foo", EN],
    ["/en/guide/utm-setup", EN],
    ["/es/foo", ES],
    ["/de/foo", DE],
    ["/pt-br/foo", PT],
  ] as const) {
    test(`${path}: 一覧は自分自身を指さず、${lang.name} を選ぶと 200 の ${lang.prefix} へ`, async ({ page }) => {
      const response = await page.goto(path, { timeout: NAV_TIMEOUT });
      expect(response?.status()).toBe(404);
      await openList(page);
      const hrefs = await switchList(page).locator("a").evaluateAll((els) => els.map((el) => el.getAttribute("href")));
      expect(hrefs).toHaveLength(5);
      expect(hrefs).not.toContain(path);

      const [navResponse] = await Promise.all([
        page.waitForResponse(
          (r) => r.request().isNavigationRequest() && new URL(r.url()).pathname === lang.prefix,
          { timeout: NAV_TIMEOUT },
        ),
        switchLinkFor(page, lang).click(),
      ]);
      await page.waitForURL((u) => u.pathname === lang.prefix, { timeout: NAV_TIMEOUT });
      expect(navResponse?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", lang.htmlLang);
    });
  }

  // 意図: 404 のページからも ja のトップへ戻れる
  test("/en/foo から ja を選ぶと 200 の / へ", async ({ page }) => {
    const response = await page.goto("/en/foo", { timeout: NAV_TIMEOUT });
    expect(response?.status()).toBe(404);
    await selectLang(page, JA, "/");
  });
});

test.describe("モバイル幅（390px）", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const path of ["/", "/en", "/pt-br", "/de", "/en/create", "/en/guide/getting-started"]) {
    // 意図: ロゴ・切り替えボタン・メニューボタンが 1 行に収まり、ヘッダーからはみ出さない
    test(`${path}: ヘッダーが 1 行に収まり横スクロールが出ない`, async ({ page }) => {
      await page.goto(path, { timeout: NAV_TIMEOUT });
      const header = page.locator("header").first();
      const logo = header.getByRole("link", { name: /QR Code Create/ });
      const button = switchButton(page);
      const menuButton = header.locator("button[aria-expanded]:not(:has(+ ul))");

      await expect(button).toBeVisible();
      await expect(menuButton).toBeVisible();

      const headerBox = (await header.boundingBox())!;
      const boxes = {
        logo: (await logo.boundingBox())!,
        button: (await button.boundingBox())!,
        menu: (await menuButton.boundingBox())!,
      };
      // 縦中心がほぼ同じ（折り返していない）
      const centers = Object.values(boxes).map((b) => b.y + b.height / 2);
      expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(8);
      // 各要素がヘッダーの内側
      for (const [name, b] of Object.entries(boxes)) {
        expect.soft(b.x, `${name} left`).toBeGreaterThanOrEqual(headerBox.x - 0.5);
        expect.soft(b.x + b.width, `${name} right`).toBeLessThanOrEqual(headerBox.x + headerBox.width + 0.5);
        expect.soft(b.y, `${name} top`).toBeGreaterThanOrEqual(headerBox.y - 0.5);
        expect.soft(b.y + b.height, `${name} bottom`).toBeLessThanOrEqual(headerBox.y + headerBox.height + 0.5);
      }
      // 左から ロゴ → 切り替え → メニューボタン
      expect(boxes.logo.x + boxes.logo.width).toBeLessThanOrEqual(boxes.button.x);
      expect(boxes.button.x + boxes.button.width).toBeLessThanOrEqual(boxes.menu.x);

      const overflow = await page.evaluate(() => {
        const el = document.scrollingElement!;
        return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
      });
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
    });
  }

  // 意図: 一覧を開いても画面の横幅に収まる（最も長い名前の pt-br を含めて）
  for (const path of ["/", "/en", "/pt-br", "/de"]) {
    test(`${path}: 一覧を開いても画面の横幅に収まり、横スクロールが出ない`, async ({ page }) => {
      await page.goto(path, { timeout: NAV_TIMEOUT });
      await openList(page);
      const box = (await switchList(page).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      const overflow = await page.evaluate(() => {
        const el = document.scrollingElement!;
        return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
      });
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
      // 一番長い名前も 1 行で、リンクが一覧の内側に収まる
      for (const lang of ALL) {
        const linkBox = (await switchLinkFor(page, lang).boundingBox())!;
        expect.soft(linkBox.x, `${lang.name} left`).toBeGreaterThanOrEqual(box.x - 0.5);
        expect.soft(linkBox.x + linkBox.width, `${lang.name} right`).toBeLessThanOrEqual(box.x + box.width + 0.5);
      }
    });
  }

  // 意図: メニューを開かずに切り替えられる
  test("/ でメニューを開かずに一覧を開き、en を選べる", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    await expect(page.locator("header button[aria-expanded]:not(:has(+ ul))")).toHaveAttribute("aria-expanded", "false");
    await selectLang(page, EN, "/en");
  });

  test("/en/create でメニューを開かずに ja を選ぶと /create へ", async ({ page }) => {
    await page.goto("/en/create", { timeout: NAV_TIMEOUT });
    await expect(page.locator("header button[aria-expanded]:not(:has(+ ul))")).toHaveAttribute("aria-expanded", "false");
    await selectLang(page, JA, "/create");
  });

  // 意図: メニューのパネル内には重ねて置かない
  test("メニューを開いても切り替えのリンクは 5 つのまま", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    const menuButton = page.locator("header button[aria-expanded]:not(:has(+ ul))");
    await menuButton.click();
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("header a[hreflang]")).toHaveCount(5);
  });
});

test.describe("デスクトップ幅", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const [path, cta] of [
    ["/", "/create"],
    ["/en", "/en/create"],
  ] as const) {
    // 意図: 切り替えボタンは CTA の右にあり、同じ行に並ぶ
    test(`${path}: 切り替えが CTA の右にある`, async ({ page }) => {
      await page.goto(path, { timeout: NAV_TIMEOUT });
      const ctaLink = page.locator(`header nav a[href="${cta}"]`).last();
      const button = switchButton(page);
      await expect(ctaLink).toBeVisible();
      await expect(button).toBeVisible();
      const ctaBox = (await ctaLink.boundingBox())!;
      const buttonBox = (await button.boundingBox())!;
      expect(buttonBox.x).toBeGreaterThanOrEqual(ctaBox.x + ctaBox.width);
      const ctaCenter = ctaBox.y + ctaBox.height / 2;
      const buttonCenter = buttonBox.y + buttonBox.height / 2;
      expect(Math.abs(ctaCenter - buttonCenter)).toBeLessThanOrEqual(8);
      // デスクトップではメニューボタンが見えない
      await expect(page.locator("header button[aria-expanded]:not(:has(+ ul))")).toBeHidden();
    });
  }
});
