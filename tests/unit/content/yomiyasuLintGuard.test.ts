/**
 * @jest-environment node
 */
import fs from "fs";
import os from "os";
import path from "path";
import {
  ROOT,
  SKILL_DIR,
  type Baseline,
  listMdx,
  listJapaneseArticles,
  hashContent,
  isLintTarget,
  collectLintFailures,
  resolvePython,
  runLint,
} from "../../helpers/yomiyasu";

// 強制テスト（yomiyasuLint.test.ts）自体が、違反を検出し、対象を取りこぼさないことを確かめる。
// 実記事や実際の baseline.json の中身には依存しない（記事を直して基準から外しても壊れない）。
const FIXTURE_DIR = "tests/fixtures/yomiyasu";
const WARN_SAMPLE = `${FIXTURE_DIR}/warn-sample.mdx`; // lint が warn を出す固定サンプル
const PASS_SAMPLE = `${FIXTURE_DIR}/pass-sample.mdx`; // lint に通る固定サンプル
const PASSING_ARTICLE = "src/content/blog/utm-on-off-when-to-use.mdx"; // 列挙の確認用（存在するだけでよい）

const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf-8");

// 一時の基準。WARN_SAMPLE と同内容の記事を基準に載せた状態を作る
const SAMPLE_KEY = "src/content/blog/baselined-warn.mdx";
const tempBaseline: Baseline = {
  yomiyasuVersion: "test",
  note: "test",
  files: { [SAMPLE_KEY]: hashContent(read(WARN_SAMPLE)) },
};

describe("yomiyasu lint の検出力", () => {
  let python: string | null = null;
  let tmpDir = "";

  beforeAll(() => {
    python = resolvePython();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "yomiyasu-guard-"));
  }, 60_000);

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("前提: 固定サンプルが存在すること", () => {
    expect(fs.existsSync(path.join(ROOT, WARN_SAMPLE))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, PASS_SAMPLE))).toBe(true);
  });

  it("lint が warn を出す文章の一時 .mdx は終了コード 1 になること", () => {
    expect(python).not.toBeNull();
    const file = path.join(tmpDir, "failing.mdx");
    fs.writeFileSync(file, read(WARN_SAMPLE), "utf-8");
    const { status, output } = runLint(python as string, file);
    expect({ status, output: status === 1 ? "" : output }).toEqual({ status: 1, output: "" });
  }, 60_000);

  it("通る記事の一時 .mdx は終了コード 0 になること", () => {
    expect(python).not.toBeNull();
    const file = path.join(tmpDir, "passing.mdx");
    fs.writeFileSync(file, read(PASS_SAMPLE), "utf-8");
    const { status, output } = runLint(python as string, file);
    expect({ status, output: status === 0 ? "" : output }).toEqual({ status: 0, output: "" });
  }, 60_000);

  describe("強制ロジック（collectLintFailures）", () => {
    it("基準外の warn 記事だけが失敗に含まれ、基準一致・通る記事・en/ は含まれないこと", () => {
      expect(python).not.toBeNull();
      const root = path.join(tmpDir, "content");
      const put = (rel: string, body: string) => {
        const abs = path.join(root, ...rel.split("/"));
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, body, "utf-8");
      };
      const failingBody = read(WARN_SAMPLE);
      // 一時の基準のキー src/content/<rel> に対応する contentRoot 内のパスに、同内容で置く
      const baselineRel = SAMPLE_KEY.replace("src/content/", "");
      put(baselineRel, failingBody); // 2: 一時の基準と同ハッシュ
      put("blog/edited-warn.mdx", failingBody + "あ"); // 1: 基準外の warn
      put("blog/new-pass.mdx", read(PASS_SAMPLE)); // 3: 通る新規
      put("en/blog/english-warn.mdx", failingBody + "い"); // 4: en/ は対象外

      const failures = collectLintFailures({ contentRoot: root, baseline: tempBaseline, python: python as string });
      const keys = failures.map((m) => m.split(" ")[0]);

      expect(keys).toEqual(["src/content/blog/edited-warn.mdx"]);
    }, 120_000);
  });

  describe("ハッシュ関数", () => {
    it("CRLF と LF で同じ値を返すこと", () => {
      expect(hashContent("あ\r\nい\r\n")).toBe(hashContent("あ\nい\n"));
    });

    it("内容が 1 文字違うと値が変わること", () => {
      expect(hashContent("あいう")).not.toBe(hashContent("あいえ"));
    });
  });

  describe("対象判定", () => {
    it("基準の記事を変更なしで読むと対象外（例外）になること", () => {
      expect(isLintTarget(tempBaseline, SAMPLE_KEY, read(WARN_SAMPLE))).toBe(false);
    });

    it("基準の記事に 1 文字足すと対象になること", () => {
      expect(isLintTarget(tempBaseline, SAMPLE_KEY, read(WARN_SAMPLE) + "あ")).toBe(true);
    });

    it("基準に載っていない記事は常に対象になること", () => {
      expect(isLintTarget(tempBaseline, "src/content/blog/new-article.mdx", "本文")).toBe(true);
    });
  });

  describe("対象の列挙", () => {
    it("src/content/en 配下は含まれないこと", () => {
      const all = listMdx(path.join(ROOT, "src/content"));
      const ja = listJapaneseArticles();
      expect(ja.filter((p) => p.startsWith("src/content/en/"))).toEqual([]);
      // en/ に .mdx があるなら、除外されて件数が減っていること
      const enCount = all.filter((p) => p.startsWith("src/content/en/")).length;
      expect(ja.length).toBe(all.length - enCount);
    });

    it("日本語記事が 1 件以上列挙されること", () => {
      expect(listJapaneseArticles()).toContain(PASSING_ARTICLE);
    });
  });

  describe("スキルの構成（v2.4.0）", () => {
    it.each([
      "scripts/yomiyasu_hook.py",
      ".codex-plugin",
      "assets",
    ])("%s が存在しないこと", (rel) => {
      expect(fs.existsSync(path.join(SKILL_DIR, rel))).toBe(false);
    });

    it.each([
      "references/calques.md",
      "references/lists/katakana-terms.txt",
    ])("%s が存在すること", (rel) => {
      expect(fs.existsSync(path.join(SKILL_DIR, rel))).toBe(true);
    });
  });
});
