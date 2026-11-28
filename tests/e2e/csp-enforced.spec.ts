import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import { installCspCollector, expectNoViolations, describeViolations, type CspCollector } from "./helpers/cspCollector";

/**
 * CSP 強制の E2E（qr_code_create-28o。Report-Only 時代の csp-report-only.spec.ts を作り直したもの）。
 * 本番ビルドで主要ページを開き、Content-Security-Policy が強制で配信され、違反が 0 件で、
 * 見た目と動作が壊れていないことを確かめる。強制では違反がそのままブロックになるため、
 * 「違反 0 件」に加えて「実際に動く」（フォント・スタイル・画像・操作）まで見る。
 * `npm run build` のあと `npm run test:e2e:prod`（本番ビルド、ポート 3100）で流す。
 *
 * GA について: NEXT_PUBLIC_GA_MEASUREMENT_ID が無いビルドでは GA のスクリプトは描画されない。
 * このファイルでは GA と同じ形のスクリプトを差し込んで script-src の許可を確かめる。
 * 本物の GA の読み込みは csp-ga.spec.ts（npm run test:e2e:ga、ポート 3101）で確かめる。
 *
 * Worker について: src に `new Worker` は無い（2026-11-28 に Grep で確認）。アプリは Worker を使わないので、
 * worker-src（script-src に従う。blob: は許可していない）で止まっても機能は壊れない。
 */

test.setTimeout(120_000);
const NAV_TIMEOUT = 90_000;
const SETTLE_MS = 1_000;
const OUT_DIR = path.join(process.cwd(), "tmp", "screenshots", "28o");

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
  // 静的ページと一覧
  "/faq",
  "/privacy",
  "/terms",
  "/guide",
  "/use-cases",
  "/blog",
  // 言語版の getting-started
  "/en/guide/getting-started",
  "/es/guide/getting-started",
  "/pt-br/guide/getting-started",
  "/de/guide/getting-started",
  // ガイド・用途・ブログの記事
  "/guide/analytics-measurement",
  "/guide/decoration",
  "/guide/utm-setup",
  "/use-cases/menu",
  "/use-cases/poster",
  "/use-cases/signage",
  "/blog/qr-code-expiration",
  "/blog/nenga-qr-utm-tracking",
  "/blog/why-i-built-qr-code-create",
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

let collector: CspCollector;

/** どのページの読み込みより先に、違反を集めるリスナーとコンソール監視を仕込む */
test.beforeEach(async ({ page }) => {
  collector = await installCspCollector(page);
  // localhost 以外への要求は、本物の外部に出さず 204 で止める。個別のテストが後から route を足すと、そちらが優先される
  await page.route(
    (url) => !/^localhost$/.test(url.hostname),
    (route) => route.fulfill({ status: 204, body: "" }),
  );
});

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

async function openCreateWithUrl(page: Page, url = "https://example.com/csp", path_ = "/create"): Promise<void> {
  await page.goto(path_, { timeout: NAV_TIMEOUT });
  await page.getByPlaceholder("https://example.com").first().fill(url);
  await expect(page.getByLabel(/生成されたQRコード|Generated QR code/)).toBeVisible({ timeout: 30_000 });
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

/** ページ内にスクリプトを差し込んで実行する（Playwright の evaluate は CSP の eval 規制を迂回しうるため、inline script で試す） */
async function runInlineScript(page: Page, code: string): Promise<void> {
  await page.evaluate((src) => {
    const s = document.createElement("script");
    s.textContent = src;
    document.head.appendChild(s);
  }, code);
}

async function waitForViolation(page: Page, effectiveDirective: string, opts: { console?: boolean } = {}) {
  // コンソール系統の正の対照: ブロックのあとにコンソールにも文言が出ること。
  // Chrome の文言が変わるとコンソール側の検査が黙って 0 件になるため、ここで検知する。
  // eval だけは、捕まえた EvalError の例外として出るだけでコンソールには出ないため対象外（console: false）
  if (opts.console !== false) {
    await expect
      .poll(() => collector.consoleMessages().filter((m) => /Refused to|Content Security Policy/.test(m)).length, {
        timeout: 10_000,
        message: "ブロックされたのにコンソールに「Refused to」「Content Security Policy」が出ていない",
      })
      .toBeGreaterThan(0);
  }
  await expect
    .poll(async () => (await collector.violations()).filter((v) => v.effectiveDirective === effectiveDirective).length, {
      timeout: 10_000,
    })
    .toBeGreaterThan(0);
  return (await collector.violations()).filter((v) => v.effectiveDirective === effectiveDirective);
}

test.describe("レスポンスヘッダー", () => {
  for (const pagePath of PAGES) {
    test(`${pagePath}: 200 で Content-Security-Policy があり、Report-Only・X-Powered-By は無い`, async ({ page }) => {
      const response = await page.goto(pagePath, { timeout: NAV_TIMEOUT });
      expect(response?.status()).toBe(200);
      const headers = response?.headers() ?? {};
      const csp = headers["content-security-policy"];
      expect(csp).toBeTruthy();
      expect(csp).not.toContain("'unsafe-eval'");
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("upgrade-insecure-requests");
      expect(headers["content-security-policy-report-only"]).toBeUndefined();
      expect(headers["x-powered-by"]).toBeUndefined();
      expect(headers["strict-transport-security"]).toBeUndefined();
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["x-frame-options"]).toBe("DENY");
    });
  }
});

test.describe("GA なしのビルド", () => {
  test("このスペックの対象は GA なしのビルド（googletagmanager.com の script も ga4-init も DOM に無い）", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    await page.waitForLoadState("load");
    const state = await page.evaluate(() => ({
      gtm: [...document.scripts].filter((s) => s.src.includes("googletagmanager.com")).length,
      ga4Init: document.getElementById("ga4-init") !== null,
    }));
    expect(state, "GA 入りのビルドで流している（npm run build で GA なしに戻す）").toEqual({ gtm: 0, ga4Init: false });
  });
});

test.describe("404 ページ", () => {
  for (const missing of ["/this-page-does-not-exist", "/en/this-page-does-not-exist"]) {
    test(`${missing}: 404 で強制の CSP があり、違反が 0 件`, async ({ page }) => {
      const response = await page.goto(missing, { timeout: NAV_TIMEOUT });
      expect(response?.status()).toBe(404);
      const headers = response?.headers() ?? {};
      expect(headers["content-security-policy"]).toContain("default-src 'self'");
      expect(headers["content-security-policy-report-only"]).toBeUndefined();
      await page.waitForLoadState("load");
      await page.waitForTimeout(SETTLE_MS);
      await expectNoViolations(collector, missing);
    });
  }
});

test.describe("子フレームとワーカーの中の違反も拾える", () => {
  test("同一オリジンの iframe（srcdoc）の中の違反を、フレームを回って拾える", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    await page.evaluate(() => {
      const f = document.createElement("iframe");
      f.srcdoc = '<img src="https://evil.example/child.png">';
      document.body.appendChild(f);
    });
    await expect
      .poll(async () => (await collector.violations()).filter((v) => v.blockedURI.includes("evil.example")).length, {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);
    const list = (await collector.violations()).filter((v) => v.blockedURI.includes("evil.example"));
    expect(list[0].effectiveDirective).toBe("img-src");
    expect(list[0].disposition).toBe("enforce");
    // 親のフレームだけを見ても見えない（= page.frames() を回る処理が効いている）
    const mainOnly = await page.evaluate(() => (window.__cspViolations ?? []).filter((v) => v.blockedURI.includes("evil.example")));
    expect(mainOnly).toEqual([]);
    expect(page.frames().length).toBeGreaterThan(1);
  });

  test("同一オリジンのワーカーから許可外へ fetch すると connect-src でブロックされ、ワーカー内のイベントで拾える", async ({ page }) => {
    const response = await page.goto("/", { timeout: NAV_TIMEOUT });
    const csp = response?.headers()["content-security-policy"] ?? "";
    // ワーカーは自分のレスポンスの CSP に従う。本物のサーバーと同じ CSP を付けて返す
    await page.route("**/csp-test-worker.js", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/javascript",
        headers: { "content-security-policy": csp },
        body:
          `self.addEventListener("securitypolicyviolation", function(e){ postMessage({type:"violation", effectiveDirective:e.effectiveDirective, blockedURI:e.blockedURI, disposition:e.disposition}); });` +
          `fetch("https://evil.example/w").then(function(){ postMessage({type:"fetch", result:"resolved"}); }, function(e){ postMessage({type:"fetch", result:"rejected:" + e.name}); });`,
      }),
    );
    const messages = await page.evaluate(
      () =>
        new Promise<{ type: string; [k: string]: string }[]>((resolve) => {
          const got: { type: string; [k: string]: string }[] = [];
          const w = new Worker("/csp-test-worker.js");
          w.onmessage = (e) => {
            got.push(e.data);
            if (got.some((m) => m.type === "fetch") && got.some((m) => m.type === "violation")) resolve(got);
          };
          w.onerror = () => resolve([...got, { type: "workerError" }]);
          setTimeout(() => resolve(got), 8_000);
        }),
    );
    console.log(`[ワーカー内の挙動] ${JSON.stringify(messages)}`);
    expect(messages.find((m) => m.type === "fetch")?.result).toMatch(/^rejected:/);
    const v = messages.find((m) => m.type === "violation");
    expect(v, `ワーカー内で違反イベントが来ない ${JSON.stringify(messages)}`).toBeDefined();
    expect(v?.effectiveDirective).toBe("connect-src");
    expect(v?.disposition).toBe("enforce");
    expect(v?.blockedURI).toContain("evil.example");
  });
});

test.describe("ページを開いたときの CSP 違反（イベントとコンソールの 2 系統）", () => {
  for (const pagePath of PAGES) {
    test(`${pagePath}: 違反が 0 件`, async ({ page }) => {
      await page.goto(pagePath, { timeout: NAV_TIMEOUT });
      await page.waitForLoadState("load");
      await page.waitForTimeout(SETTLE_MS);
      await expectNoViolations(collector, pagePath);
    });
  }
});

test.describe("強制のもとで見た目と動作が壊れていない", () => {
  /** フォント・スタイル・画像の検査。ブロックされると静かに壊れるものを実測で見る */
  async function expectRenderedProperly(page: Page, label: string): Promise<void> {
    // フォント: 失敗（error）が無く、Noto Sans JP が読み込まれている
    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].map((f) => ({ family: f.family, status: f.status }));
    });
    expect(fonts.filter((f) => f.status === "error"), `${label}: 読み込みに失敗したフォント`).toEqual([]);
    expect(
      fonts.some((f) => /Noto/i.test(f.family) && f.status === "loaded"),
      `${label}: Noto Sans JP が loaded になっていない ${JSON.stringify(fonts)}`,
    ).toBe(true);

    // スタイル: body にフォントが当たり、主要な要素の大きさが 0 でなく、リンクした CSS が読めている
    const styled = await page.evaluate(() => {
      const heading = document.querySelector("h1") ?? document.querySelector("main") ?? document.body;
      const rect = heading.getBoundingClientRect();
      const sheets = [...document.styleSheets];
      return {
        bodyFont: getComputedStyle(document.body).fontFamily,
        bodyMargin: getComputedStyle(document.body).margin,
        width: rect.width,
        height: rect.height,
        sheetCount: sheets.length,
        unreadableSheets: sheets.filter((s) => {
          try {
            return s.cssRules.length === 0;
          } catch {
            return true;
          }
        }).length,
      };
    });
    expect(styled.bodyFont, `${label}: body に Noto Sans JP のフォントが当たっていない`).toMatch(/Noto/i);
    expect(styled.width).toBeGreaterThan(0);
    expect(styled.height).toBeGreaterThan(0);
    expect(styled.sheetCount).toBeGreaterThan(0);
    expect(styled.unreadableSheets, `${label}: 読めない CSS がある`).toBe(0);

    // 画像: 遅延読み込みのものも含め、すべて naturalWidth > 0
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(
        async () =>
          page.evaluate(() =>
            [...document.images].filter((img) => img.currentSrc !== "" && img.naturalWidth === 0).map((img) => img.currentSrc),
          ),
        { timeout: 15_000, message: `${label}: 読み込めていない画像がある` },
      )
      .toEqual([]);
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  async function shot(page: Page, name: string): Promise<void> {
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`) });
  }

  test("/: ハイドレーション後にヘッダーのリンクで遷移でき、フォント・スタイル・next/image が壊れていない", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    await page.waitForLoadState("load");
    // next/image のヒーロー画像が実際にある（画像の検査が空振りしない）
    expect(await page.locator("img").count()).toBeGreaterThan(0);
    await expectRenderedProperly(page, "/");
    await shot(page, "top");
    await page.locator('a[href="/create"]:visible').first().click();
    await expect(page).toHaveURL(/\/create$/);
    await expect(page.getByPlaceholder("https://example.com").first()).toBeVisible();
    await expectNoViolations(collector, "/ の操作");
  });

  test("/create: URL を入れると QR が出て、フォント・スタイル・next/image が壊れていない", async ({ page }) => {
    await openCreateWithUrl(page);
    await expectRenderedProperly(page, "/create");
    await shot(page, "create");
    await expectNoViolations(collector, "/create の操作");
  });

  test("/poster: 入力するとポスターのボタンが有効になり、フォント・スタイルが壊れていない", async ({ page }) => {
    await page.goto("/poster", { timeout: NAV_TIMEOUT });
    await page.getByLabel("QRコードに埋め込むURL").fill("https://example.com/shop");
    await page.getByLabel("説明文（Markdown）").fill("## 今週のおすすめ");
    await expect(page.getByRole("button", { name: POSTER_BUTTON })).toBeEnabled({ timeout: 15_000 });
    await expectRenderedProperly(page, "/poster");
    await shot(page, "poster");
    await expectNoViolations(collector, "/poster の操作");
  });

  test("/en/create: 英語版でも URL を入れると QR が出て、フォント・スタイルが壊れていない", async ({ page }) => {
    await openCreateWithUrl(page, "https://example.com/en", "/en/create");
    await expectRenderedProperly(page, "/en/create");
    await shot(page, "en-create");
    await expectNoViolations(collector, "/en/create の操作");
  });

  test("記事（/blog/utm-on-off-when-to-use）: ヘッダーのリンクで遷移でき、フォント・スタイル・画像が壊れていない", async ({ page }) => {
    await page.goto("/blog/utm-on-off-when-to-use", { timeout: NAV_TIMEOUT });
    await page.waitForLoadState("load");
    await expectRenderedProperly(page, "記事");
    await shot(page, "article");
    await page.locator('a[href="/create"]:visible').first().click();
    await expect(page).toHaveURL(/\/create$/);
    await expectNoViolations(collector, "記事の操作");
  });
});

test.describe("upgrade-insecure-requests", () => {
  test("強制でも http://localhost の本番ビルドを壊さない（JS・CSS が読めて、操作できる）", async ({ page }) => {
    const failed: string[] = [];
    page.on("requestfailed", (r) => {
      if (r.url().startsWith("http://localhost") || r.url().startsWith("https://localhost")) {
        failed.push(`${r.url()} ${r.failure()?.errorText}`);
      }
    });
    const localRequests: string[] = [];
    page.on("request", (r) => {
      if (/^https?:\/\/localhost/.test(r.url())) localRequests.push(r.url());
    });

    const response = await page.goto("/create", { timeout: NAV_TIMEOUT });
    expect(response?.headers()["content-security-policy"]).toContain("upgrade-insecure-requests");
    // JS が動く（ハイドレーション後に QR が出る）。CSS が読めてスタイルが当たっている
    await page.getByPlaceholder("https://example.com").first().fill("https://example.com/uir");
    await expect(page.getByLabel(/生成されたQRコード|Generated QR code/)).toBeVisible({ timeout: 30_000 });
    const sheetRules = await page.evaluate(() =>
      [...document.styleSheets].reduce((n, s) => {
        try {
          return n + s.cssRules.length;
        } catch {
          return n;
        }
      }, 0),
    );
    expect(sheetRules).toBeGreaterThan(0);

    expect(failed, `localhost への失敗した要求\n${failed.join("\n")}`).toEqual([]);
    expect(localRequests.length).toBeGreaterThan(0);
    // localhost は http のまま（https に格上げされて接続失敗することが無い）
    expect(localRequests.every((u) => u.startsWith("http://localhost:3100"))).toBe(true);
    await expectNoViolations(collector, "upgrade-insecure-requests");
  });

  test("ページから http:// の画像を読もうとすると、https に格上げした URL で要求される", async ({ page }) => {
    // img-src が許可している GA のホストを使う（許可外のホストでは CSP が先に止めて要求自体が出ない）。外部には出さず route で応答する
    const requested: string[] = [];
    page.on("request", (r) => requested.push(r.url()));
    const png = Buffer.from(PNG_BASE64, "base64");
    const respond = (route: import("@playwright/test").Route) => route.fulfill({ status: 200, contentType: "image/png", body: png });
    await page.route("https://www.google-analytics.com/**", respond);
    await page.route("http://www.google-analytics.com/**", respond);

    await page.goto("/", { timeout: NAV_TIMEOUT });
    const loaded = await page.evaluate(
      () =>
        new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = "http://www.google-analytics.com/csp-upgrade-test.png";
        }),
    );
    expect(loaded).toBe(true);
    const hits = requested.filter((u) => u.includes("csp-upgrade-test.png"));
    expect(hits).toEqual(["https://www.google-analytics.com/csp-upgrade-test.png"]);
    await expectNoViolations(collector, "http 画像の格上げ");
  });
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
    await expectNoViolations(collector, "/create のダウンロード");
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
    await expectNoViolations(collector, "ロゴ付きのダウンロード");
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
    await expectNoViolations(collector, "/poster の PDF 生成");
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
    await expectNoViolations(collector, "GA 相当のスクリプト");
  });
});

test.describe("問い合わせフォーム（本物の form-mailer には送らない）", () => {
  const DUMMY_HTML = "<!doctype html><html><head><title>dummy confirm</title></head><body><p id=\"dummy\">dummy form-mailer</p></body></html>";

  async function fillContactForm(page: Page): Promise<void> {
    await page.goto("/contact", { timeout: NAV_TIMEOUT });
    await page.getByLabel("姓", { exact: true }).fill("テスト");
    await page.getByLabel("名", { exact: true }).fill("太郎");
    await page.getByLabel(/メールアドレス/).fill("csp-test@example.com");
    await page.getByLabel("件名", { exact: true }).fill("CSP の確認");
    await page.getByLabel(/お問合せ内容/).fill("これは CSP のテストです。送信されません。");
  }

  test("/contact の送信が CSP に止められず ssl.form-mailer.jp への POST として出る（ダミーで応答）", async ({ page }) => {
    const posts: { url: string; method: string; body: string }[] = [];
    await page.route("https://ssl.form-mailer.jp/**", (route) => {
      const req = route.request();
      posts.push({ url: req.url(), method: req.method(), body: req.postData() ?? "" });
      return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: DUMMY_HTML });
    });

    await fillContactForm(page);
    // 送信前の時点で違反が無い
    await expectNoViolations(collector, "/contact の送信前");
    await page.getByRole("button", { name: "確認画面へ" }).click();

    await expect(page.locator("#dummy")).toBeVisible({ timeout: 15_000 });
    expect(page.url()).toBe("https://ssl.form-mailer.jp/fm/service/Forms/confirm");
    expect(posts).toHaveLength(1);
    expect(posts[0].method).toBe("POST");
    expect(posts[0].url).toBe("https://ssl.form-mailer.jp/fm/service/Forms/confirm");
    // 入力した値が送られている（フォームの値が CSP で欠けたりしない）
    expect(decodeURIComponent(posts[0].body)).toContain("csp-test@example.com");
    expect(decodeURIComponent(posts[0].body)).toContain("key=bd905569880937");
    // 止められていれば遷移せず、送信元ページに form-action の違反が残る。遷移後の新しいドキュメントにも違反が無い
    await expectNoViolations(collector, "/contact の送信後");
  });

  test("/contact の送信先が別ドメインへ 302 リダイレクトしたときの Chrome の挙動を記録する", async ({ page }) => {
    // 本物の form-mailer がリダイレクトするかどうかは PM が別に確かめる。ここでは「もしリダイレクトしたら」の事実だけを残す
    const targetHits: string[] = [];
    await page.route("https://ssl.form-mailer.jp/**", (route) =>
      route.fulfill({ status: 302, headers: { Location: "https://redirect-target.example/landing" } }),
    );
    await page.route("https://redirect-target.example/**", (route) => {
      targetHits.push(route.request().url());
      return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: DUMMY_HTML });
    });

    await fillContactForm(page);
    await page.getByRole("button", { name: "確認画面へ" }).click();
    const formViolations = await waitForViolation(page, "form-action");
    // 遷移が起きないことを見る待ち（何も起きないことの確認なので固定で残す）
    await page.waitForTimeout(1_000);
    console.log(
      `[302 の記録] url=${page.url()} targetHits=${JSON.stringify(targetHits)} formActionViolations=${describeViolations(formViolations) || "なし"}`,
    );
    test.info().annotations.push({
      type: "form-mailer 302",
      description: `url=${page.url()} targetHits=${targetHits.length} formActionViolations=${formViolations.length}`,
    });
    // 観測した事実（Chromium、2026-11-28）: form-action は 302 の移動先にも適用され、許可外の移動先はブロックされる。
    // 遷移せず送信元（/contact）に留まり、移動先には要求が届かない。違反は form-action（enforce）で、
    // blockedURI は移動先ではなくリダイレクト前の URL（クロスオリジンの移動先を漏らさないため）で報告される
    expect(new URL(page.url()).pathname).toBe("/contact");
    expect(targetHits).toEqual([]);
    expect(formViolations).toHaveLength(1);
    expect(formViolations[0].disposition).toBe("enforce");
    expect(formViolations[0].blockedURI).toBe("https://ssl.form-mailer.jp/fm/service/Forms/confirm");
  });
});

test.describe("対照（異常系）: 許可していないものは強制でブロックされる", () => {
  test("許可していない外部ドメインのスクリプトは onerror になり、実行されない（script-src-elem）", async ({ page }) => {
    let hits = 0;
    await page.route("https://evil.example/**", (route) => {
      hits++;
      return route.fulfill({ status: 200, contentType: "application/javascript", body: "window.__evilRan = true;" });
    });
    await page.goto("/", { timeout: NAV_TIMEOUT });
    const outcome = await page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          const s = document.createElement("script");
          s.src = "https://evil.example/x.js";
          s.onload = () => resolve("load");
          s.onerror = () => resolve("error");
          document.head.appendChild(s);
        }),
    );
    expect(outcome).toBe("error");
    expect(await page.evaluate(() => Reflect.get(window, "__evilRan"))).toBeUndefined();
    const list = await waitForViolation(page, "script-src-elem");
    expect(list[0].blockedURI).toContain("evil.example");
    expect(list[0].disposition).toBe("enforce");
    expect(hits).toBe(0);
  });

  test("許可していない先への fetch は reject される（connect-src）", async ({ page }) => {
    let hits = 0;
    await page.route("https://evil.example/**", (route) => {
      hits++;
      return route.fulfill({ status: 200, body: "ok", headers: { "access-control-allow-origin": "*" } });
    });
    await page.goto("/", { timeout: NAV_TIMEOUT });
    const outcome = await page.evaluate(() =>
      fetch("https://evil.example/api").then(
        () => "resolved",
        (e: Error) => `rejected:${e.name}`,
      ),
    );
    expect(outcome).toMatch(/^rejected:/);
    const list = await waitForViolation(page, "connect-src");
    expect(list[0].blockedURI).toContain("evil.example");
    expect(list[0].disposition).toBe("enforce");
    expect(hits).toBe(0);
  });

  test("許可していない外部の画像は読み込まれない（img-src）", async ({ page }) => {
    let hits = 0;
    await page.route("https://evil.example/**", (route) => {
      hits++;
      return route.fulfill({ status: 200, contentType: "image/png", body: Buffer.from(PNG_BASE64, "base64") });
    });
    await page.goto("/", { timeout: NAV_TIMEOUT });
    const outcome = await page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          const img = new Image();
          img.onload = () => resolve("load");
          img.onerror = () => resolve("error");
          img.src = "https://evil.example/x.png";
        }),
    );
    expect(outcome).toBe("error");
    const list = await waitForViolation(page, "img-src");
    expect(list[0].blockedURI).toContain("evil.example");
    expect(list[0].disposition).toBe("enforce");
    expect(hits).toBe(0);
  });

  test("許可していない外部の iframe はブロックされる（frame-src → default-src 'self'）", async ({ page }) => {
    let hits = 0;
    await page.route("https://evil.example/**", (route) => {
      hits++;
      return route.fulfill({ status: 200, contentType: "text/html", body: "<p>evil</p>" });
    });
    await page.goto("/", { timeout: NAV_TIMEOUT });
    await page.evaluate(() => {
      const f = document.createElement("iframe");
      f.src = "https://evil.example/frame.html";
      document.body.appendChild(f);
    });
    const list = await waitForViolation(page, "frame-src");
    expect(list[0].blockedURI).toContain("evil.example");
    expect(list[0].disposition).toBe("enforce");
    expect(hits).toBe(0);
  });

  test("blob: の Worker はブロックされる（worker-src。script-src に従い blob: を許可していない）", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    const outcome = await page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          try {
            const url = URL.createObjectURL(new Blob(["postMessage('ran')"], { type: "text/javascript" }));
            const w = new Worker(url);
            w.onmessage = () => resolve("ran");
            w.onerror = () => resolve("error");
            setTimeout(() => resolve("timeout"), 4_000);
          } catch (e) {
            resolve(`throw:${(e as Error).name}`);
          }
        }),
    );
    expect(outcome).not.toBe("ran");
    const list = await waitForViolation(page, "worker-src");
    expect(list[0].blockedURI).toBe("blob");
    expect(list[0].disposition).toBe("enforce");
  });

  test("eval と new Function は本番では投げる（'unsafe-eval' が無い）", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    // inline script は evaluate の最中に同期で実行される。Playwright（CDP の Runtime.evaluate）はその間だけ eval の規制を外すため、
    // 実行を setTimeout で evaluate のあとに回す（同期のままだと eval が通ってしまい、検査にならない）
    await runInlineScript(
      page,
      `setTimeout(function(){` +
        `window.__evalResult = (function(){ try { return String(eval("1+1")); } catch (e) { return "throw:" + e.name; } })();` +
        `window.__fnResult = (function(){ try { return String(new Function("return 1+1")()); } catch (e) { return "throw:" + e.name; } })();` +
        `}, 0);`,
    );
    await page.waitForFunction(() => Reflect.get(window, "__fnResult") !== undefined);
    expect(await page.evaluate(() => Reflect.get(window, "__evalResult"))).toBe("throw:EvalError");
    expect(await page.evaluate(() => Reflect.get(window, "__fnResult"))).toBe("throw:EvalError");
    const list = await waitForViolation(page, "script-src", { console: false });
    expect(list[0].blockedURI).toBe("eval");
    expect(list[0].disposition).toBe("enforce");
  });

  test("許可していない先へのフォーム送信はブロックされる（form-action）", async ({ page }) => {
    let hits = 0;
    await page.route("https://evil.example/**", (route) => {
      hits++;
      return route.fulfill({ status: 200, contentType: "text/html", body: "<p>evil</p>" });
    });
    await page.goto("/", { timeout: NAV_TIMEOUT });
    const before = page.url();
    await page.evaluate(() => {
      const f = document.createElement("form");
      f.action = "https://evil.example/post";
      f.method = "post";
      document.body.appendChild(f);
      f.submit();
    });
    const list = await waitForViolation(page, "form-action");
    expect(list[0].blockedURI).toContain("evil.example");
    expect(list[0].disposition).toBe("enforce");
    await page.waitForTimeout(500);
    expect(page.url()).toBe(before);
    expect(hits).toBe(0);
  });
});
