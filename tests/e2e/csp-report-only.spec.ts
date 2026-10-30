import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * CSP Report-Only の E2E（qr_code_create-j0q）。
 * 本番ビルドで主要ページを開き、securitypolicyviolation が 0 件であることを確かめる。
 * Report-Only なので違反してもブロックされない。そのため disposition が report のものも集める。
 * `npm run build` のあと `npm run test:e2e:prod`（本番ビルド、ポート 3100）で流す。
 *
 * GA について: NEXT_PUBLIC_GA_MEASUREMENT_ID はビルド時に埋め込まれ、環境変数が無いビルドでは
 * GA のスクリプトは描画されない。既存に GA を強制する仕組み（環境変数付きのビルド）は無い。
 * そのため GA の実読み込みは検査せず、GA と同じ形（googletagmanager.com の外部スクリプトとインラインスクリプト）を
 * ページに差し込み、script-src の許可で違反にならないことを確かめる（外部への通信は route で止める）。
 */

test.setTimeout(120_000);
const NAV_TIMEOUT = 90_000;
const SETTLE_MS = 1_000;
const OUT_DIR = path.join(process.cwd(), "tmp", "screenshots", "j0q");

type Violation = {
  violatedDirective: string;
  effectiveDirective: string;
  blockedURI: string;
  disposition: string;
  sourceFile: string;
};

declare global {
  interface Window {
    __cspViolations?: Violation[];
  }
}

const PAGES = [
  "/",
  "/create",
  "/poster",
  "/guide/getting-started",
  "/use-cases/event",
  "/blog/utm-on-off-when-to-use",
  "/contact",
  "/en",
  "/es",
  "/pt-br",
  "/de",
  "/en/create",
  "/es/create",
  "/pt-br/create",
  "/de/create",
] as const;

const PNG_BUTTON = "PNG形式でダウンロード";
const SVG_BUTTON = "SVG形式でダウンロード";
const PDF_BUTTON = "PDF形式でダウンロード";
const POSTER_BUTTON = "PDFをダウンロード（A4印刷用）";

// 8x8 の赤い PNG
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAEklEQVR4nGP8z8Dwn4EIwDiqEAB3pAf9dQKJWQAAAABJRU5ErkJggg==";
const SIMPLE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60">' +
  '<rect width="120" height="60" fill="#d33"/><circle cx="60" cy="30" r="20" fill="#fff"/></svg>';

/** どのページの読み込みより先に、違反を集めるリスナーを仕込む */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      window.__cspViolations?.push({
        violatedDirective: e.violatedDirective,
        effectiveDirective: e.effectiveDirective,
        blockedURI: e.blockedURI,
        disposition: e.disposition,
        sourceFile: e.sourceFile,
      });
    });
  });
});

async function violations(page: Page): Promise<Violation[]> {
  const list = await page.evaluate(() => window.__cspViolations);
  // リスナーが入っていないと「違反 0 件」が素通りするため、未定義なら失敗にする
  if (list === undefined) throw new Error("window.__cspViolations が未定義です（リスナーが仕込まれていません）");
  return list;
}

function describeViolations(list: Violation[]): string {
  return list
    .map((v) => `${v.violatedDirective} (effective: ${v.effectiveDirective}) blocked=${v.blockedURI} disposition=${v.disposition} source=${v.sourceFile}`)
    .join("\n");
}

async function expectNoViolations(page: Page, where: string): Promise<void> {
  const list = await violations(page);
  expect(list, `${where} で CSP 違反が ${list.length} 件\n${describeViolations(list)}`).toEqual([]);
}

async function openCreateWithUrl(page: Page, url = "https://example.com/csp"): Promise<void> {
  await page.goto("/create", { timeout: NAV_TIMEOUT });
  await page.getByPlaceholder("https://example.com").first().fill(url);
  await expect(page.getByLabel("生成されたQRコード")).toBeVisible({ timeout: 30_000 });
}

async function downloadVia(page: Page, buttonName: string, ext: RegExp, saveAs: string): Promise<Buffer> {
  const button = page.getByRole("button", { name: buttonName });
  await expect(button).toBeEnabled();
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), button.click()]);
  expect(download.suggestedFilename()).toMatch(ext);
  const target = path.join(OUT_DIR, saveAs);
  await download.saveAs(target);
  const bytes = fs.readFileSync(target);
  expect(bytes.length).toBeGreaterThan(0);
  return bytes;
}

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

test.describe("レスポンスヘッダー", () => {
  for (const pagePath of PAGES) {
    test(`${pagePath}: Content-Security-Policy-Report-Only があり、X-Powered-By と強制の CSP は無い`, async ({ page }) => {
      const response = await page.goto(pagePath, { timeout: NAV_TIMEOUT });
      expect(response?.status()).toBe(200);
      const headers = response?.headers() ?? {};
      const csp = headers["content-security-policy-report-only"];
      expect(csp).toBeTruthy();
      expect(csp).not.toContain("'unsafe-eval'");
      expect(csp).toContain("default-src 'self'");
      expect(headers["x-powered-by"]).toBeUndefined();
      expect(headers["content-security-policy"]).toBeUndefined();
      expect(headers["strict-transport-security"]).toBeUndefined();
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["x-frame-options"]).toBe("DENY");
    });
  }
});

test.describe("問い合わせフォーム", () => {
  test("/contact のフォームの送信先の origin が CSP の form-action に含まれる", async ({ page }) => {
    const response = await page.goto("/contact", { timeout: NAV_TIMEOUT });
    const csp = response?.headers()["content-security-policy-report-only"] ?? "";
    const formAction = csp
      .split("; ")
      .find((d) => d.startsWith("form-action "))
      ?.split(" ")
      .slice(1);
    expect(formAction).toBeDefined();

    const actions = await page.locator("form").evaluateAll((forms) => forms.map((f) => (f as HTMLFormElement).action));
    expect(actions.length).toBeGreaterThan(0);
    for (const action of actions) {
      const origin = new URL(action).origin;
      // 同一オリジンは 'self'、外部なら form-action に origin が載っている
      if (origin !== new URL(page.url()).origin) expect(formAction).toContain(origin);
    }
    expect(actions.some((a) => new URL(a).origin === "https://ssl.form-mailer.jp")).toBe(true);
  });
});

test.describe("ページを開いたときの CSP 違反", () => {
  for (const pagePath of PAGES) {
    test(`${pagePath}: securitypolicyviolation が 0 件`, async ({ page }) => {
      await page.goto(pagePath, { timeout: NAV_TIMEOUT });
      await page.waitForLoadState("load");
      await page.waitForTimeout(SETTLE_MS);
      await expectNoViolations(page, pagePath);
    });
  }
});

test.describe("操作中の CSP 違反", () => {
  test("/create で PNG・SVG・PDF をダウンロードでき、違反が 0 件", async ({ page }) => {
    await openCreateWithUrl(page);

    const png = await downloadVia(page, PNG_BUTTON, /\.png$/, "plain.png");
    expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");

    const svg = await downloadVia(page, SVG_BUTTON, /\.svg$/, "plain.svg");
    expect(svg.toString("utf8")).toContain("<svg");

    const pdf = await downloadVia(page, PDF_BUTTON, /\.pdf$/, "plain.pdf");
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");

    await page.waitForTimeout(SETTLE_MS);
    await expectNoViolations(page, "/create のダウンロード");
  });

  test("/create で PNG と SVG のロゴをアップロードしてダウンロードでき、違反が 0 件", async ({ page }) => {
    await openCreateWithUrl(page);
    const input = page.locator('input[type="file"]').first();

    await input.setInputFiles({ name: "mark.png", mimeType: "image/png", buffer: Buffer.from(PNG_BASE64, "base64") });
    await expect(page.getByAltText("ロゴ: mark.png")).toBeVisible({ timeout: 15_000 });
    const withPng = await downloadVia(page, PNG_BUTTON, /\.png$/, "logo-png.png");
    expect(withPng.subarray(1, 4).toString("latin1")).toBe("PNG");

    // ロゴを付けている間はファイル入力が消えるため、いったん外してから SVG を選ぶ
    await page.getByRole("button", { name: "ロゴを削除" }).click();
    await input.setInputFiles({ name: "mark.svg", mimeType: "image/svg+xml", buffer: Buffer.from(SIMPLE_SVG) });
    const thumb = page.getByAltText("ロゴ: mark.svg");
    await expect(thumb).toBeVisible({ timeout: 15_000 });
    // SVG は canvas で PNG に変換される（data: / blob: の画像読み込みが CSP の img-src に収まる）
    await expect(thumb).toHaveAttribute("src", /^data:image\/png;base64,/);
    const withSvg = await downloadVia(page, PNG_BUTTON, /\.png$/, "logo-svg.png");
    expect(withSvg.subarray(1, 4).toString("latin1")).toBe("PNG");
    await downloadVia(page, SVG_BUTTON, /\.svg$/, "logo-svg.svg");
    await downloadVia(page, PDF_BUTTON, /\.pdf$/, "logo-svg.pdf");

    await page.waitForTimeout(SETTLE_MS);
    await expectNoViolations(page, "ロゴ付きのダウンロード");
  });

  test("/poster でポスター PDF を生成でき、違反が 0 件", async ({ page }) => {
    await page.goto("/poster", { timeout: NAV_TIMEOUT });
    await page.getByLabel("QRコードに埋め込むURL").fill("https://example.com/shop");
    await page.getByLabel("説明文（Markdown）").fill("## 今週のおすすめ\n\n**限定メニュー** をご用意しました");
    await expect(page.getByRole("button", { name: POSTER_BUTTON })).toBeEnabled({ timeout: 15_000 });

    const pdf = await downloadVia(page, POSTER_BUTTON, /^qr-poster-\d{8}-\d{6}\.pdf$/, "poster.pdf");
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    await expect(page.getByText("PDFをダウンロードしました")).toBeVisible();

    await page.waitForTimeout(SETTLE_MS);
    await expectNoViolations(page, "/poster の PDF 生成");
  });

  test("GA と同じ形（googletagmanager.com の外部スクリプトとインラインスクリプト）は違反にならない", async ({ page }) => {
    await page.route("https://www.googletagmanager.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: "window.__gtmLoaded = true;" }),
    );
    await page.goto("/", { timeout: NAV_TIMEOUT });

    const loaded = await page.evaluate(
      () =>
        new Promise<boolean>((resolve) => {
          const external = document.createElement("script");
          external.src = "https://www.googletagmanager.com/gtag/js?id=G-TEST";
          external.onload = () => {
            const inline = document.createElement("script");
            inline.textContent = "window.__inlineRan = true;";
            document.head.appendChild(inline);
            resolve(true);
          };
          external.onerror = () => resolve(false);
          document.head.appendChild(external);
        }),
    );
    expect(loaded).toBe(true);
    expect(await page.evaluate(() => Reflect.get(window, "__inlineRan"))).toBe(true);
    await page.waitForTimeout(SETTLE_MS);
    await expectNoViolations(page, "GA 相当のスクリプト");
  });
});

test.describe("対照（異常系）: 違反の検出が素通りしない", () => {
  test("許可していない外部ドメインのスクリプトは violation として集められる", async ({ page }) => {
    await page.route("https://evil.example/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
    );
    await page.goto("/", { timeout: NAV_TIMEOUT });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const s = document.createElement("script");
          s.src = "https://evil.example/x.js";
          s.onload = () => resolve();
          s.onerror = () => resolve();
          document.head.appendChild(s);
        }),
    );
    await page.waitForTimeout(500);

    const list = await violations(page);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].effectiveDirective).toBe("script-src-elem");
    expect(list[0].blockedURI).toContain("evil.example");
    // Report-Only なので報告だけで、実際には読み込まれる
    expect(list[0].disposition).toBe("report");
  });
});
