/**
 * 本物の GA を読み込むビルドで、CSP の E2E（tests/e2e/csp-ga.spec.ts）を流す。
 * 実行: npm run test:e2e:ga
 *
 * 注意: このスクリプトは .next を GA 入りのビルドで上書きする。Playwright が終わったら（成功でも失敗でも、
 * 最初の GA 入りビルドが失敗したときも）、GA なしの通常のビルドを自動で流し直す。
 * 流し直すビルドには NEXT_PUBLIC_GA_MEASUREMENT_ID を渡さない（親プロセスに設定されていても外す）。
 * 流し直しを飛ばすには環境変数 SKIP_REBUILD=1 を付ける。その場合 .next は GA 入りのままなので、npm run build を流し直すこと。
 * 終了コードは Playwright（または最初のビルド）の失敗を優先し、それが 0 で再ビルドが失敗したときは再ビルドの終了コードを返す。
 *
 * 測定 ID は環境変数 NEXT_PUBLIC_GA_MEASUREMENT_ID があればそれ、無ければ本番の公開値（本番の HTML に載っている値）を使う。
 * テスト中、GA への送信は page.route で 204 を返し、GA に実データは送らない（gtag.js などの読み込みだけが実際に外へ出る）。
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
const GA_ENV_KEY = "NEXT_PUBLIC_GA_MEASUREMENT_ID";

/**
 * 子プロセスに渡す環境変数を作る。値が undefined のキーは取り除く（親に設定されていても渡さない）。
 */
function buildEnv(baseEnv, overrides) {
  const merged = { ...baseEnv, ...overrides };
  for (const key of Object.keys(merged)) {
    if (merged[key] === undefined) delete merged[key];
  }
  return merged;
}

/** GA 入りのビルドと Playwright に渡す環境変数 */
function gaEnv(baseEnv) {
  return buildEnv(baseEnv, { [GA_ENV_KEY]: baseEnv[GA_ENV_KEY] || PUBLIC_GA_ID });
}

/** 流し直す（GA なしの）ビルドに渡す環境変数 */
function rebuildEnv(baseEnv) {
  return buildEnv(baseEnv, { [GA_ENV_KEY]: undefined });
}

/** 再ビルドを飛ばすか */
function shouldSkipRebuild(baseEnv) {
  return baseEnv.SKIP_REBUILD === "1";
}

/**
 * 終了コードを決める。Playwright（または最初のビルド）の失敗を優先し、それが 0 のときだけ再ビルドの結果を返す。
 * @param {number} testStatus 最初のビルドが失敗していればそのコード、でなければ Playwright のコード
 * @param {number | null} rebuildStatus 再ビルドの終了コード。流さなかったときは null
 */
function decideExitCode(testStatus, rebuildStatus) {
  if (testStatus !== 0) return testStatus;
  return rebuildStatus === null ? 0 : rebuildStatus;
}

function run(script, args, env) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    stdio: "inherit",
    env,
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
  const env = gaEnv(process.env);
  let testStatus = run(nextBin, ["build"], env);
  if (testStatus === 0) {
    testStatus = run(playwrightBin, ["test", "--config", "playwright.ga.config.ts", ...extraArgs], env);
  }

  // 最初のビルドが失敗したときも .next は壊れているので、再ビルドを試みる
  let rebuildStatus = null;
  if (shouldSkipRebuild(process.env)) {
    console.error(".next は GA 入りのまま。npm run build を流し直すこと");
  } else {
    console.error("GA なしの通常のビルドを流し直します");
    rebuildStatus = run(nextBin, ["build"], rebuildEnv(process.env));
  }
  return decideExitCode(testStatus, rebuildStatus);
}

module.exports = { main, PUBLIC_GA_ID, buildEnv, gaEnv, rebuildEnv, shouldSkipRebuild, decideExitCode };

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}
