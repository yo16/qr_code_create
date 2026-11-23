/**
 * ビルドしてから、ビルド成果物の検査を skip させずに jest を流す。
 * 実行: npm run test:built [-- jest に渡す引数]
 *
 * package.json の build（next build）と同じものを流す。build の中身を変えたら、ここも直す。
 * shell を経由せず node で直接起動するので、空白を含む引数も割れない。
 */
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS スクリプト */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const jestBin = path.join(root, "node_modules", "jest", "bin", "jest.js");

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
  if (result.status === null) {
    return 1;
  }
  return result.status;
}

// 終了コードを返す（テストから呼べるように、process.exit は直接実行のときだけ）
function main(jestArgs) {
  for (const bin of [nextBin, jestBin]) {
    if (!fs.existsSync(bin)) {
      console.error(`見つかりません: ${bin}（npm install を実行してください）`);
      return 1;
    }
  }
  const buildStatus = run(nextBin, ["build"], {});
  if (buildStatus !== 0) {
    return buildStatus;
  }
  return run(jestBin, jestArgs, { REQUIRE_BUILD_OUTPUT: "1" });
}

module.exports = { main, nextBin, jestBin };

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}
