/**
 * 本物の GA を読み込むビルドで、CSP の E2E（tests/e2e/csp-ga.spec.ts）を流す。
 * 実行: npm run test:e2e:ga
 *
 * 注意: このスクリプトは .next を GA 入りのビルドで上書きする。通常の本番ビルド（GA なし）に戻すには、
 * もう一度 `npm run build` を流す（npm run test:built も内部でビルドし直す）。
 *
 * 測定 ID は環境変数 NEXT_PUBLIC_GA_MEASUREMENT_ID があればそれ、無ければ本番の公開値（本番の HTML に載っている値）を使う。
 * テスト中、GA への送信は page.route で 204 を返し、GA に実データは送らない（gtag.js の読み込みだけが実際に外へ出る）。
 * shell を経由せず node で直接起動する。
 */
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS スクリプト */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const playwrightBin = path.join(root, "node_modules", "@playwright", "test", "cli.js");
const PUBLIC_GA_ID = "G-19CMXJKY5M";

function run(script, args, env) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.error) {
    console.error(result.error);
    return 1;
  }
  return result.status === null ? 1 : result.status;
}

function main(extraArgs) {
  for (const bin of [nextBin, playwrightBin]) {
    if (!fs.existsSync(bin)) {
      console.error(`見つかりません: ${bin}（npm install を実行してください）`);
      return 1;
    }
  }
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || PUBLIC_GA_ID;
  const env = { NEXT_PUBLIC_GA_MEASUREMENT_ID: gaId };
  const buildStatus = run(nextBin, ["build"], env);
  if (buildStatus !== 0) return buildStatus;
  return run(playwrightBin, ["test", "--config", "playwright.ga.config.ts", ...extraArgs], env);
}

module.exports = { main, PUBLIC_GA_ID };

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}
