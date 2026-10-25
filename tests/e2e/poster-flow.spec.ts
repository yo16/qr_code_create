import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * 印刷用ポスター（/poster）の E2E（qr_code_create-ro1）。
 *
 * /poster は公開済み（FEATURE_FLAGS.posterPage = true）なので、常に流す（skip しない）。
 * `npm run build` のあと `npm run test:e2e:poster`（本番ビルド、ポート 3100）で流す。
 * 既定の playwright.config.ts（dev サーバー）では、PDF 生成が遅くポート 3000 も衝突しやすいため対象外。
 * 目視確認用に、スクリーンショットとダウンロードした PDF を tmp/screenshots/ro1/ に保存する。
 * ファイル名を .spec.ts にしているのは、Jest の testMatch に拾われないようにするため。
 */

const OUT_DIR = path.join(process.cwd(), "tmp", "screenshots", "ro1");

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const DOWNLOAD_BUTTON = "PDFをダウンロード（A4印刷用）";
const PREPARING_BUTTON = "QRコードを準備中...";
const DESCRIPTION_LABEL = "説明文（Markdown）";
const URL_LABEL = "QRコードに埋め込むURL";
const FILE_NAME_PATTERN = /^qr-poster-\d{8}-\d{6}\.pdf$/;
const MIN_PDF_BYTES = 50 * 1024;
const MAX_PDF_BYTES = 5 * 1024 * 1024;

test.describe("印刷用ポスター", () => {
  test.beforeAll(async ({ playwright, baseURL }) => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    // フラグなしのビルドで流すと /poster が 404 になり、全件 skip ではなく失敗にして気づけるようにする
    const request = await playwright.request.newContext({ baseURL });
    const response = await request.get("/poster");
    await request.dispose();
    expect(response.status(), "/poster が 404 です。機能フラグ posterPage が true か確認してください").not.toBe(404);
  });

  /** QR の描画が終わるまで待つ（ボタンが「準備中」でなくなり、押せる状態になる） */
  async function waitForReady(page: Page) {
    await expect(page.getByRole("button", { name: DOWNLOAD_BUTTON })).toBeEnabled({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: PREPARING_BUTTON })).toHaveCount(0);
  }

  /** 4 枚のカードの QR が、親（role="img"）の枠に収まり、幅が枠にほぼ等しい正方形であること */
  async function expectQrFitsFrame(page: Page) {
    const result = await page.getByTestId("poster-card").evaluateAll((cards) =>
      cards.map((card) => {
        const canvas = card.querySelector("canvas") as HTMLCanvasElement;
        const frame = canvas.parentElement as HTMLElement; // role="img" の要素
        const c = canvas.getBoundingClientRect();
        const f = frame.getBoundingClientRect();
        return {
          role: frame.getAttribute("role"),
          canvas: { l: c.left, t: c.top, r: c.right, b: c.bottom, w: c.width, h: c.height },
          frame: { l: f.left, t: f.top, r: f.right, b: f.bottom, w: f.width },
        };
      })
    );
    expect(result).toHaveLength(4);
    const tolerance = 1;
    for (const { role, canvas, frame } of result) {
      expect(role).toBe("img");
      expect(canvas.w).toBeGreaterThan(20);
      expect(canvas.l).toBeGreaterThanOrEqual(frame.l - tolerance);
      expect(canvas.t).toBeGreaterThanOrEqual(frame.t - tolerance);
      expect(canvas.r).toBeLessThanOrEqual(frame.r + tolerance);
      expect(canvas.b).toBeLessThanOrEqual(frame.b + tolerance);
      expect(Math.abs(canvas.w - canvas.h)).toBeLessThanOrEqual(2);
      // 枠より小さく縮んでもいない（幅がほぼ等しい）
      expect(Math.abs(canvas.w - frame.w)).toBeLessThanOrEqual(3);
    }
  }

  /** 保存した PDF が 1 ページであること（/Type /Page の数。/Pages は数えない） */
  function expectSinglePage(file: string) {
    const text = fs.readFileSync(file).toString("latin1");
    const pages = text.match(/\/Type\s*\/Page(?![A-Za-z])/g) ?? [];
    expect(pages).toHaveLength(1);
  }

  /** PDF をダウンロードして、ファイル名の形式とサイズを確かめる。保存先のパスを返す */
  async function downloadAndVerify(page: Page, saveAs: string): Promise<number> {
    const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
    await page.getByRole("button", { name: DOWNLOAD_BUTTON }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(FILE_NAME_PATTERN);

    const target = path.join(OUT_DIR, saveAs);
    await download.saveAs(target);
    const size = fs.statSync(target).size;
    expect(size).toBeGreaterThanOrEqual(MIN_PDF_BYTES);
    expect(size).toBeLessThanOrEqual(MAX_PDF_BYTES);
    // PDF のヘッダー
    const head = fs.readFileSync(target).subarray(0, 5).toString("latin1");
    expect(head).toBe("%PDF-");
    expectSinglePage(target);

    await expect(page.getByText("PDFをダウンロードしました")).toBeVisible();
    return size;
  }

  test("/create で設定 → ポスター導線 → /poster で説明文を入力 → PDF をダウンロードできる（デスクトップ幅）", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: VIEWPORTS[0].width, height: VIEWPORTS[0].height });

    // UTM（source/medium）と装飾（プリセット elegant: 色・フレーム）を URL パラメータで設定する
    await page.goto("/create?utm_source=poster&utm_medium=qr&preset=elegant");
    await page.getByPlaceholder("https://example.com").first().fill("https://example.com/shop");

    const cta = page.getByRole("button", { name: /印刷用ポスターを作る/ });
    await expect(cta).toBeVisible();
    await cta.click();

    await expect(page).toHaveURL(/\/poster$/);
    // 引き継ぎが反映されている
    await expect(page.getByLabel(URL_LABEL)).toHaveValue("https://example.com/shop");
    await expect(page.getByLabel("適用される装飾")).toContainText("フレーム");

    // 説明文が空の間は押せない
    await expect(page.getByRole("button", { name: DOWNLOAD_BUTTON })).toBeDisabled();

    await page.getByLabel(DESCRIPTION_LABEL).fill("## 今週のおすすめ\n\n**限定メニュー** をご用意しました");
    await waitForReady(page);

    // 4 枚のカードが並び、フレームあり（elegant）でも QR が枠に収まる
    await expect(page.getByTestId("poster-card")).toHaveCount(4);
    await expectQrFitsFrame(page);

    await page.screenshot({
      path: path.join(OUT_DIR, "poster-handoff-desktop.png"),
      fullPage: true,
    });
    const preview = page.getByRole("group", { name: /ポスターのプレビュー/ });
    await preview.screenshot({ path: path.join(OUT_DIR, "poster-preview-desktop.png") });
    // 1 枚目のカードの QR 部分の拡大（位置検出パターンが 3 つ見えるかを目視する）
    await page
      .getByTestId("poster-card")
      .first()
      .getByRole("img")
      .screenshot({ path: path.join(OUT_DIR, "qr-closeup-1280.png") });

    const size = await downloadAndVerify(page, "poster-desktop-1280.pdf");
    console.log(`PDF size (desktop 1280): ${size} bytes`);
  });

  test("/poster を直接開いたとき（引き継ぎなし）URL と説明文を入力して PDF をダウンロードできる（モバイル幅）", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: VIEWPORTS[1].width, height: VIEWPORTS[1].height });

    await page.goto("/poster");
    await expect(page.getByLabel(URL_LABEL)).toHaveValue("");
    // 何も入力していないので押せない
    await expect(page.getByRole("button", { name: DOWNLOAD_BUTTON })).toBeDisabled();
    await expect(page.getByText("有効なURLを入力するとPDFをダウンロードできます")).toBeVisible();

    await page.getByLabel(URL_LABEL).fill("https://example.com/direct");
    // URL だけでは押せない（説明文が空）
    await expect(page.getByRole("button", { name: DOWNLOAD_BUTTON })).toBeDisabled();
    await page.getByLabel(DESCRIPTION_LABEL).fill("## ご案内\n\nQRコードからお申し込みください");
    await waitForReady(page);

    await expect(page.getByTestId("poster-card")).toHaveCount(4);

    await page.screenshot({
      path: path.join(OUT_DIR, "poster-direct-mobile.png"),
      fullPage: true,
    });
    const preview = page.getByRole("group", { name: /ポスターのプレビュー/ });
    await preview.screenshot({ path: path.join(OUT_DIR, "poster-preview-mobile.png") });

    const size = await downloadAndVerify(page, "poster-mobile-390.pdf");
    console.log(`PDF size (mobile 390): ${size} bytes`);
  });

  test("説明文が空（空白だけを含む）のとき、URL が有効でもボタンが無効でヒントが出る", async ({
    page,
  }) => {
    await page.goto("/poster");
    await page.getByLabel(URL_LABEL).fill("https://example.com/empty-desc");

    const button = page.getByRole("button", { name: DOWNLOAD_BUTTON });
    await expect(button).toBeDisabled();
    await expect(page.getByText("説明文を入力するとPDFをダウンロードできます")).toBeVisible();

    await page.getByLabel(DESCRIPTION_LABEL).fill("   \n  ");
    await expect(button).toBeDisabled();

    // 内容を入れると、QR の描画が終わった時点で押せるようになる
    await page.getByLabel(DESCRIPTION_LABEL).fill("説明");
    await waitForReady(page);
    await expect(page.getByText("説明文を入力するとPDFをダウンロードできます")).toHaveCount(0);
  });

  for (const viewport of VIEWPORTS) {
    test(`4 枚のカードの QR が枠からはみ出さず正方形で描かれる（${viewport.name} ${viewport.width}px）`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/poster");
      await page.getByLabel(URL_LABEL).fill("https://example.com/bounds");
      await page.getByLabel(DESCRIPTION_LABEL).fill("## 確認\n\nQR の大きさ");
      await waitForReady(page);

      await expectQrFitsFrame(page);
    });
  }

  test("QR が作れない長さの URL では、PDF ボタンが無効で理由が出て、短い URL に直すと消える", async ({ page }) => {
    await page.goto("/poster");
    // validateUrl は通るが、誤り訂正レベル H の QR の容量（約 1,270 バイト）を超える URL
    const tooLong = `https://example.com/${"a".repeat(1600)}`;
    await page.getByLabel(URL_LABEL).fill(tooLong);
    await page.getByLabel(DESCRIPTION_LABEL).fill("説明");

    const reason = page.getByText("QRコードを作れませんでした。URL やロゴ・フレームの画像を確認してください");
    await expect(reason).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: DOWNLOAD_BUTTON })).toBeDisabled();
    await expect(page.getByRole("button", { name: PREPARING_BUTTON })).toHaveCount(0);

    await page.getByLabel(URL_LABEL).fill("https://example.com/short");
    await expect(reason).toHaveCount(0, { timeout: 15_000 });
    await waitForReady(page);
  });

  test("説明文を消すと、押せる状態から再び無効に戻る", async ({ page }) => {
    await page.goto("/poster");
    await page.getByLabel(URL_LABEL).fill("https://example.com/toggle");
    await page.getByLabel(DESCRIPTION_LABEL).fill("説明");
    await waitForReady(page);

    await page.getByLabel(DESCRIPTION_LABEL).fill("");

    await expect(page.getByRole("button", { name: DOWNLOAD_BUTTON })).toBeDisabled();
  });
});
