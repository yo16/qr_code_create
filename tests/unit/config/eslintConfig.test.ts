import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

/**
 * ESLint 設定（eslint.config.mjs）の回帰ガードテスト（qr_code_create-sp1「lint エラーの整理」）。
 *
 * 背景: エージェントが `.claude/worktrees/` にリポジトリを複製すると、その中の `src/**` まで
 * lint 対象になり、`npm run lint` が本体と無関係なエラーで落ちていた。同様に `tmp/`、
 * `test-results/`、`playwright-report/` などの一時出力も lint 対象に戻ると誤検知の原因になる。
 *
 * このテストは次の 2 面から回帰を防ぐ。
 *   1. テキスト検証: `globalIgnores([...])` の配列に必要な除外パターンがあり、
 *      `src/**` などの lint 対象が誤って除外されていないこと
 *   2. 実判定: ESLint の Node API（`ESLint#isPathIgnored`）で実際に無視される／されないことを確認
 *
 * 2 は Jest（CJS）の VM 内で `new ESLint().isPathIgnored()` を呼ぶと、flat config（.mjs）の
 * 動的 import で "A dynamic import callback was invoked without --experimental-vm-modules"
 * になることを確認済み（2026-10-24）。そのため子プロセスの Node で ESLint API を実行し、
 * 結果を JSON で受け取る方式にしている。
 */

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "eslint.config.mjs");

/** eslint.config.mjs から `globalIgnores([...])` の配列要素（文字列）を抜き出す */
function readGlobalIgnores(): string[] {
  const source = fs.readFileSync(CONFIG_PATH, "utf8");
  const match = source.match(/globalIgnores\(\s*\[([\s\S]*?)\]\s*\)/);
  if (!match) {
    throw new Error("eslint.config.mjs に globalIgnores([...]) が見つかりません");
  }
  // 行コメントを落としてから、クォートされた文字列だけを拾う
  const body = match[1].replace(/\/\/[^\n]*/g, "");
  const patterns: string[] = [];
  for (const m of body.matchAll(/["']([^"']+)["']/g)) {
    patterns.push(m[1]);
  }
  return patterns;
}

/**
 * ESLint Node API で各パスが無視対象かどうかを判定する（子プロセスで実行）。
 * 返り値は { [path]: boolean }
 */
function isPathIgnoredByEslint(paths: string[]): Record<string, boolean> {
  const script = [
    'const { ESLint } = require("eslint");',
    `const paths = ${JSON.stringify(paths)};`,
    "(async () => {",
    "  const eslint = new ESLint({ cwd: process.cwd() });",
    "  const out = {};",
    "  for (const p of paths) out[p] = await eslint.isPathIgnored(p);",
    '  process.stdout.write("\\n__RESULT__" + JSON.stringify(out));',
    "})().catch((e) => { console.error(e); process.exit(1); });",
  ].join("\n");
  const stdout = execFileSync(process.execPath, ["-e", script], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const marker = stdout.lastIndexOf("__RESULT__");
  if (marker < 0) {
    throw new Error(`ESLint 子プロセスの出力に結果が含まれていません: ${stdout}`);
  }
  return JSON.parse(stdout.slice(marker + "__RESULT__".length)) as Record<string, boolean>;
}

describe("eslint.config.mjs の globalIgnores（テキスト検証）", () => {
  const ignores = readGlobalIgnores();

  it("globalIgnores([...]) が空でない配列として読み取れること", () => {
    // 意図: 正規表現での抜き出しが壊れたまま後続テストが「含まれない」側で偶然通るのを防ぐ
    expect(ignores.length).toBeGreaterThan(0);
  });

  it.each([".next/**", "out/**", "build/**", "next-env.d.ts"])(
    "eslint-config-next 既定の除外 %s が引き続き含まれること",
    (pattern) => {
      // 意図: globalIgnores で既定の ignores を上書きしているため、既定分を落とすと
      // ビルド成果物（.next 等）が lint 対象に戻る
      expect(ignores).toContain(pattern);
    }
  );

  it.each([".claude/**", "tmp/**", "test-results/**", "playwright-report/**"])(
    "エージェントの worktree 複製・一時出力の除外 %s が含まれること",
    (pattern) => {
      // 意図: .claude/worktrees/ 配下の複製リポジトリや一時ファイル・テスト成果物が
      // lint 対象に戻り、本体と無関係なエラーで npm run lint が落ちる回帰を防ぐ
      expect(ignores).toContain(pattern);
    }
  );

  it.each(["src", "tests", "scripts"])(
    "lint 対象ディレクトリ %s/ が除外されていないこと",
    (dir) => {
      // 意図: 除外を広げすぎて本体コード・テスト・スクリプトが lint から外れる回帰を防ぐ
      const matched = ignores.filter(
        (p) => p === dir || p === `${dir}/` || p.startsWith(`${dir}/`)
      );
      expect(matched).toEqual([]);
    }
  );

  it("すべてを無視する包括パターン（** や *）が含まれないこと", () => {
    // 意図: 誤って全ファイル除外を入れると lint が何も検査しなくなる
    expect(ignores).not.toContain("**");
    expect(ignores).not.toContain("*");
    expect(ignores).not.toContain("**/*");
  });
});

describe("ESLint Node API による実判定（isPathIgnored）", () => {
  const IGNORED = [
    ".claude/worktrees/x/src/app/page.tsx",
    "tmp/scratch.ts",
    "test-results/report.js",
    "playwright-report/index.js",
    ".next/server/app/page.js",
  ];
  const LINTED = ["src/app/page.tsx", "scripts/build-icons.cjs", "tests/setup.ts"];

  let result: Record<string, boolean>;

  beforeAll(() => {
    // eslint-config-next の読み込みに数秒かかるため、1 回だけまとめて判定する
    result = isPathIgnoredByEslint([...IGNORED, ...LINTED]);
  }, 60_000);

  it.each(IGNORED)("%s は lint 対象外（isPathIgnored=true）であること", (p) => {
    // 意図: 設定ファイルの文言だけでなく、ESLint が実際に無視することを確認する
    expect(result[p]).toBe(true);
  });

  it.each(LINTED)("%s は lint 対象（isPathIgnored=false）であること", (p) => {
    // 意図: 除外パターンが広すぎて本体コード・スクリプト・テストまで無視される回帰を防ぐ
    expect(result[p]).toBe(false);
  });
});
