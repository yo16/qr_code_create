import { expect, type Locator, type Page } from "@playwright/test";

/**
 * 言語切り替え（disclosure）の E2E 共通の操作。
 * language-switch.spec.ts と en-acceptance.spec.ts の両方から使う。
 */

/** 切り替えのボタン（メニューボタンは直後に ul を持たない） */
export function switchButton(page: Page): Locator {
  return page.locator("header button:has(+ ul)");
}

/** 切り替えの一覧（ボタンの直後の ul） */
export function switchList(page: Page): Locator {
  return page.locator("header button:has(+ ul) + ul");
}

/** 一覧を開く。ハイドレーション前のクリックは失われるので、aria-expanded="true" になるまで繰り返す */
export async function openList(page: Page): Promise<void> {
  const button = switchButton(page);
  await expect(async () => {
    if ((await button.getAttribute("aria-expanded")) !== "true") await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true", { timeout: 1000 });
  }).toPass({ timeout: 15_000 });
  await expect(switchList(page)).toBeVisible();
}
