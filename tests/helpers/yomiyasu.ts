import fs from "fs";
import path from "path";
import crypto from "crypto";
import { spawnSync } from "child_process";

// yomiyasu lint の強制テスト（yomiyasuLint.test.ts）と検出力のテスト（yomiyasuLintGuard.test.ts）の共通処理

export const ROOT = process.cwd();
export const CONTENT_DIR = path.join(ROOT, "src/content");
export const SKILL_DIR = path.join(ROOT, ".claude/skills/yomiyasu");
export const LINT_PY = path.join(SKILL_DIR, "scripts/yomiyasu_lint.py");
export const BASELINE_PATH = path.join(ROOT, "tests/fixtures/yomiyasu-baseline.json");

// lint 1 回あたりの実測は 1 秒未満。遅い環境を見込んで余裕を持たせる
export const LINT_TIMEOUT_MS = 30_000;
export const TEST_TIMEOUT_MS = 180_000;

export type Baseline = { yomiyasuVersion: string; note: string; files: Record<string, string> };

export function loadBaseline(): Baseline {
  return JSON.parse(fs.readFileSync(BASELINE_PATH, "utf-8"));
}

/** 改行を \n に正規化した UTF-8 内容の sha256（OS の改行差で外れないようにする） */
export function hashContent(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n");
  return crypto.createHash("sha256").update(normalized, "utf-8").digest("hex");
}

/** dir 配下の .mdx をリポジトリ相対パス（/ 区切り）で再帰的に列挙する */
export function listMdx(dir: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...listMdx(full));
    } else if (entry.name.endsWith(".mdx")) {
      result.push(path.relative(ROOT, full).split(path.sep).join("/"));
    }
  }
  return result.sort();
}

/** lint 対象の日本語記事を列挙する。英語版（en/）は対象外 */
export function listJapaneseArticles(contentDir: string = CONTENT_DIR): string[] {
  return listMdx(contentDir).filter((p) => !/(^|\/)src\/content\/en\//.test(p) && !p.startsWith("en/"));
}

/** 基準のキーに付く接頭辞。contentRoot からの相対パスにこれを付けると基準のキーになる */
export const BASELINE_KEY_PREFIX = "src/content/";

/** dir 配下の .mdx を dir からの相対パス（/ 区切り）で再帰的に列挙する */
export function listMdxRelative(dir: string, sub = ""): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(path.join(dir, sub), { withFileTypes: true })) {
    const rel = sub ? `${sub}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      result.push(...listMdxRelative(dir, rel));
    } else if (entry.name.endsWith(".mdx")) {
      result.push(rel);
    }
  }
  return result.sort();
}

/**
 * 強制ロジック本体。contentRoot 配下の日本語記事（en/ を除く）のうち、
 * 基準と同じハッシュのものを除いて lint し、落ちたものを失敗メッセージの配列で返す。
 * 基準のキーは `src/content/<contentRoot からの相対パス>` で引く。
 */
export function collectLintFailures(opts: {
  contentRoot: string;
  baseline: Baseline;
  python: string;
}): string[] {
  const { contentRoot, baseline, python } = opts;
  const failures: string[] = [];
  for (const rel of listMdxRelative(contentRoot)) {
    if (rel.startsWith("en/")) continue;
    const abs = path.join(contentRoot, ...rel.split("/"));
    const key = `${BASELINE_KEY_PREFIX}${rel}`;
    if (!isLintTarget(baseline, key, fs.readFileSync(abs, "utf-8"))) continue;
    const { status, output } = runLint(python, abs);
    if (status !== 0) failures.push(`${key} (終了コード ${status})\n${output.trim()}`);
  }
  return failures;
}

/** 内容が基準のハッシュと一致する（＝例外として許容される）か */
export function matchesBaseline(baseline: Baseline, relPath: string, content: string): boolean {
  const expected = baseline.files[relPath];
  if (!expected) return false;
  return hashContent(content) === expected;
}

/** lint を必須にする対象か。基準に載っていない、または基準から内容が変わっていれば true */
export function isLintTarget(baseline: Baseline, relPath: string, content: string): boolean {
  return !matchesBaseline(baseline, relPath, content);
}

/** python3 → python の順に、メジャーバージョンが 3 のものを探す。無ければ null */
export function resolvePython(): string | null {
  for (const cmd of ["python3", "python"]) {
    const r = spawnSync(cmd, ["-I", "-c", "import sys; print(sys.version_info[0])"], {
      encoding: "utf-8",
      timeout: LINT_TIMEOUT_MS,
    });
    if (r.status === 0 && r.stdout.trim() === "3") return cmd;
  }
  return null;
}

/** 1 ファイルに lint をかけ、終了コードと出力を返す（__pycache__ を作らない） */
export function runLint(python: string, filePath: string): { status: number | null; output: string } {
  const r = spawnSync(
    python,
    ["-I", "-B", LINT_PY, filePath, "--doc-type", "article", "--reader", "general", "--fail-on", "warn"],
    { cwd: ROOT, encoding: "utf-8", timeout: LINT_TIMEOUT_MS }
  );
  return { status: r.status, output: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}
