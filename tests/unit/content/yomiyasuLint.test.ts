/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";
import {
  ROOT,
  SKILL_DIR,
  LINT_PY,
  TEST_TIMEOUT_MS,
  loadBaseline,
  CONTENT_DIR,
  listMdx,
  collectLintFailures,
  matchesBaseline,
  resolvePython,
  runLint,
} from "../../helpers/yomiyasu";

// src/content 配下の日本語記事は yomiyasu lint を通すこと（.claude/rules/yomiyasu-lint.md）。
// 既存の一部記事は基準ファイルに載せて例外とし、編集した時点で lint 必須に戻す。
const baseline = loadBaseline();

// 基準の件数の上限。基準は減らすだけで増やさない（減らしたら、この数も下げてよい）
const BASELINE_MAX_COUNT = 19;

// 基準に載せてよい記事の元の 19 本。
// 意図: 直した記事を基準から外すのは可、別の記事を新たに足すのは不可（件数上限だけだと入れ替えができてしまう）
const ORIGINAL_BASELINE_PATHS = [
  "src/content/blog/why-i-built-qr-code-create.mdx",
  "src/content/guide/analytics-measurement.mdx",
  "src/content/guide/decoration.mdx",
  "src/content/guide/design-tips.mdx",
  "src/content/guide/download-formats.mdx",
  "src/content/guide/effective-qr-usage.mdx",
  "src/content/guide/getting-started.mdx",
  "src/content/guide/tips.mdx",
  "src/content/guide/utm-parameters.mdx",
  "src/content/guide/utm-setup.mdx",
  "src/content/use-cases/business-card.mdx",
  "src/content/use-cases/event.mdx",
  "src/content/use-cases/flyer.mdx",
  "src/content/use-cases/menu.mdx",
  "src/content/use-cases/poster.mdx",
  "src/content/use-cases/product-package.mdx",
  "src/content/use-cases/receipt.mdx",
  "src/content/use-cases/signage.mdx",
  "src/content/use-cases/store.mdx",
];

describe("yomiyasu lint: src/content の日本語記事", () => {
  let python: string | null = null;

  beforeAll(() => {
    python = resolvePython();
  }, 60_000);

  it("Python 3 が見つかること", () => {
    // 意図: Python が無い環境で lint が黙ってスキップされるのを防ぐ
    expect(python).not.toBeNull();
  });

  it("lint スクリプトが存在すること", () => {
    // 意図: スクリプトが消えて対象 0 件のまま素通りするのを防ぐ
    expect(fs.existsSync(LINT_PY)).toBe(true);
  });

  it(
    "基準に載っていない記事、または基準から変更した記事は lint が終了コード 0 で通ること",
    () => {
      // 意図: 新規記事と、例外の記事を編集した場合に lint を必須にする
      expect(python).not.toBeNull();
      const failures = collectLintFailures({
        contentRoot: CONTENT_DIR,
        baseline,
        python: python as string,
      });
      expect(failures).toEqual([]);
    },
    TEST_TIMEOUT_MS
  );

  describe("基準ファイル", () => {
    it(`基準の件数が ${BASELINE_MAX_COUNT} を超えないこと`, () => {
      // 意図: 基準は減らすだけで増やさない。新しい記事を基準に逃がさせない
      expect(Object.keys(baseline.files).length).toBeLessThanOrEqual(BASELINE_MAX_COUNT);
    });

    it("基準のキーが元の 19 本の部分集合であること", () => {
      // 意図: 直した記事を外すのは可。別の記事を足す入れ替えは不可
      const extra = Object.keys(baseline.files).filter((p) => !ORIGINAL_BASELINE_PATHS.includes(p));
      expect(extra).toEqual([]);
    });

    it("src/content/en に .mdx があり、en/ 除外が空振りしていないこと", () => {
      // 意図: en/ が空や改名で、除外のテストが無意味になるのを防ぐ
      const en = listMdx(CONTENT_DIR).filter((p) => p.startsWith("src/content/en/"));
      expect(en.length).toBeGreaterThanOrEqual(1);
    });

    it("基準に載っているファイルがすべて存在すること", () => {
      // 意図: 記事の削除や改名で基準が古くならないようにする
      const missing = Object.keys(baseline.files).filter(
        (p) => !fs.existsSync(path.join(ROOT, p))
      );
      expect(missing).toEqual([]);
    });

    it("基準の版が SKILL.md とスクリプトの版表記と一致すること", () => {
      // 意図: スキルを更新したのに基準を取り直していない状態を検出する
      const skillMd = fs.readFileSync(path.join(SKILL_DIR, "SKILL.md"), "utf-8");
      const lintPy = fs.readFileSync(LINT_PY, "utf-8");
      const skillVersion = /^\s*version:\s*"([^"]+)"/m.exec(skillMd)?.[1];
      const scriptVersion = /^__version__\s*=\s*"([^"]+)"/m.exec(lintPy)?.[1];
      expect(skillVersion).toBe(baseline.yomiyasuVersion);
      expect(scriptVersion).toBe(baseline.yomiyasuVersion);
    });

    it("基準のハッシュが現状の内容と一致すること", () => {
      // 意図: 編集して lint を通した記事が、古いハッシュのまま基準に残るのを防ぐ。直したら基準から外す
      const stale = Object.keys(baseline.files)
        .filter((p) => !matchesBaseline(baseline, p, fs.readFileSync(path.join(ROOT, p), "utf-8")))
        .map((p) => `${p}: 編集した基準記事は lint を通して tests/fixtures/yomiyasu-baseline.json から外す`);
      expect(stale).toEqual([]);
    });

    it(
      "ハッシュが一致する基準ファイルは、実際に lint で落ちること",
      () => {
        // 意図: 直った記事を基準に残さない。通るなら基準から外させる
        expect(python).not.toBeNull();
        const passing: string[] = [];
        for (const rel of Object.keys(baseline.files)) {
          const abs = path.join(ROOT, rel);
          if (!fs.existsSync(abs) || !matchesBaseline(baseline, rel, fs.readFileSync(abs, "utf-8"))) {
            continue;
          }
          if (runLint(python as string, rel).status === 0) passing.push(rel);
        }
        // 通る記事があれば、そのパスが差分に出る。tests/fixtures/yomiyasu-baseline.json から外すこと
        expect(passing).toEqual([]);
      },
      TEST_TIMEOUT_MS
    );
  });
});
