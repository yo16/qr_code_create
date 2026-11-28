import { test, expect, type Page, type Request } from "@playwright/test";
import fs from "fs";
import path from "path";
import { installCspCollector, describeViolations, type CspCollector } from "./helpers/cspCollector";

/**
 * 本物の GA（gtag.js）を読み込むビルドでの CSP の E2E（qr_code_create-28o）。
 * `npm run test:e2e:ga`（scripts/test-e2e-ga.cjs。GA 入りでビルドし直し、ポート 3101 で流す）で実行する。
 *
 * gtag.js（https://www.googletagmanager.com/gtag/js）だけは本物を読む。
 * それ以外の localhost 以外への要求は、すべて route で 204 を返して止める（GA に実データを送らない）。
 * 止めていない外部への要求が 1 件でもあれば失敗にする（コードで保証する）。
 * 違反が出たら CSP を緩めて通さず、失敗のまま事実（blockedURI と effectiveDirective）を報告する。
 *
 * 観測した送信先は tests/fixtures/ga-observed-hosts.json に手で保存する（単体テストが CSP の許可と突き合わせる）。
 * このテストはファイルを書き換えない。fixture に無いホストを観測したら出力に出す。
 */

test.setTimeout(120_000);
const NAV_TIMEOUT = 90_000;
const SETTLE_MS = 3_000;
const OUT_DIR = path.join(process.cwd(), "tmp", "screenshots", "28o");
const FIXTURE = path.join(process.cwd(), "tests", "fixtures", "ga-observed-hosts.json");
const GTAG_PREFIX = "https://www.googletagmanager.com/gtag/js";

type Stopped = { host: string; path: string; method: string; resourceType: string; url: string };

let collector: CspCollector;
let stopped: Stopped[];
let externalRequests: string[];

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  collector = await installCspCollector(page);
  stopped = [];
  externalRequests = [];
  page.on("request", (r: Request) => {
    const u = new URL(r.url());
    if (u.hostname === "localhost" || r.url().startsWith(GTAG_PREFIX)) return;
    if (!/^https?:$/.test(u.protocol)) return;
    externalRequests.push(r.url());
  });
  // localhost と gtag.js 以外の外部への要求は、すべて 204 で止める
  await page.route(
    (url) => url.hostname !== "localhost",
    (route) => {
      const req = route.request();
      const u = new URL(req.url());
      if (req.url().startsWith(GTAG_PREFIX)) return route.continue();
      stopped.push({ host: u.host, path: u.pathname, method: req.method(), resourceType: req.resourceType(), url: req.url() });
      return route.fulfill({ status: 204, body: "" });
    },
  );
});

/** 止めていない外部への要求が 1 件も無いこと（GA に実データが出ていない保証） */
function expectNothingEscaped(): void {
  const stoppedUrls = new Set(stopped.map((s) => s.url));
  const escaped = externalRequests.filter((u) => !stoppedUrls.has(u));
  expect(escaped, `route で止めていない外部への要求\n${escaped.join("\n")}`).toEqual([]);
}

async function failIfViolations(where: string): Promise<void> {
  const list = await collector.violations();
  const logs = collector.consoleMessages();
  const detail = list.map((v) => `blockedURI=${v.blockedURI} effectiveDirective=${v.effectiveDirective}`).join("\n");
  expect(list, `${where}: CSP 違反イベント ${list.length} 件\n${detail}\n${describeViolations(list)}`).toEqual([]);
  expect(logs, `${where}: CSP のコンソール出力 ${logs.length} 件\n${logs.join("\n")}`).toEqual([]);
}

/** GA 入りのビルドであること。空振りで通さず、満たさなければ失敗にする */
async function expectGaBuild(page: Page): Promise<void> {
  const state = await page.evaluate(() => ({
    gtagScript: [...document.scripts].some((s) => s.src.startsWith("https://www.googletagmanager.com/gtag/js?id=")),
    ga4Init: document.getElementById("ga4-init") !== null,
    gtagFunction: typeof (window as unknown as { gtag?: unknown }).gtag === "function",
    dataLayer: Array.isArray((window as unknown as { dataLayer?: unknown }).dataLayer),
  }));
  expect(state.gtagScript, "gtag.js の script 要素がページに無い（GA 入りのビルドではない）").toBe(true);
  expect(state.ga4Init, "id=ga4-init の script 要素が無い（GA 入りのビルドではない）").toBe(true);
  expect(state.gtagFunction, "typeof window.gtag が function ではない（ga4-init が実行されていない）").toBe(true);
  expect(state.dataLayer, "window.dataLayer が無い").toBe(true);
}

/** gtag.js が実際に 200 で取れたことを確かめながら開く */
async function openAndSettle(page: Page, url: string): Promise<void> {
  const gtagResponse = page.waitForResponse((r) => r.url().startsWith(GTAG_PREFIX), { timeout: NAV_TIMEOUT });
  await page.goto(url, { timeout: NAV_TIMEOUT });
  const res = await gtagResponse;
  expect(res.status(), `gtag.js の応答（${res.url()}）が 200 ではない`).toBe(200);
  await page.waitForLoadState("load");
  await page.waitForTimeout(SETTLE_MS);
}

function reportObserved(): void {
  const fixture = JSON.parse(fs.readFileSync(FIXTURE, "utf8")) as { entries: { host: string; path: string }[] };
  const known = new Set(fixture.entries.map((e) => `${e.host}${e.path}`));
  const observed = [...new Map(stopped.map((s) => [`${s.host}${s.path}`, s])).values()];
  const unknown = observed.filter((s) => !known.has(`${s.host}${s.path}`));
  console.log(`[GA 送信先] ${observed.map((s) => `${s.method} ${s.host}${s.path} (${s.resourceType})`).join(", ") || "なし"}`);
  if (unknown.length > 0) {
    const text = unknown.map((s) => `${s.host}${s.path}`).join(", ");
    console.log(`[GA 送信先: fixture に無い] ${text} → tests/fixtures/ga-observed-hosts.json に手で足し、単体テストで CSP の許可を確かめる`);
    test.info().annotations.push({ type: "fixture に無い GA 送信先", description: text });
  }
}

test.describe("本物の gtag.js を読み込んだときの CSP", () => {
  for (const url of ["/", "/create", "/en/create"]) {
    test(`${url}: GA 入りのビルドで gtag.js が 200 で取れて実行され、CSP 違反が 0 件`, async ({ page }) => {
      await openAndSettle(page, url);
      await expectGaBuild(page);
      await failIfViolations(url);
      expectNothingEscaped();
    });
  }

  test("/create: QR を作って PNG をダウンロードでき（qr_downloaded）、GA の送信が止められず、違反が 0 件", async ({ page }) => {
    await openAndSettle(page, "/create");
    await expectGaBuild(page);

    await page.getByPlaceholder("https://example.com").first().fill("https://example.com/ga");
    await expect(page.getByLabel("生成されたQRコード")).toBeVisible({ timeout: 30_000 });
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 60_000 }),
      page.getByRole("button", { name: "PNG形式でダウンロード" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.png$/);
    await download.saveAs(path.join(OUT_DIR, "ga-download.png"));

    // qr_downloaded が dataLayer に積まれている
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            ((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []).some((e) =>
              JSON.stringify(Array.from(e as ArrayLike<unknown>)).includes("qr_downloaded"),
            ),
          ),
        { timeout: 15_000, message: "dataLayer に qr_downloaded が無い" },
      )
      .toBe(true);

    // 送信の要求が 1 件以上 route に届く（＝ CSP に止められていない）まで待つ
    await expect.poll(() => stopped.length, { timeout: 15_000, message: "GA の送信が 1 件も route に届いていない（CSP に止められた可能性）" }).toBeGreaterThan(0);
    // 違反が遅れて出ないことを見る待ち（何も起きないことの確認なので固定で残す）
    await page.waitForTimeout(SETTLE_MS);

    const hosts = [...new Set(stopped.map((s) => s.host))].sort();
    test.info().annotations.push({ type: "GA 送信先ホスト", description: hosts.join(", ") });
    reportObserved();

    await failIfViolations("/create の QR ダウンロード");
    expectNothingEscaped();
  });
});
