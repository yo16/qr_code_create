/**
 * @jest-environment node
 */
import fs from "fs";
import os from "os";
import path from "path";
import matter from "gray-matter";
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
  NON_JA_DIRS,
  isNonJaPath,
  loadBaseline,
} from "../../helpers/yomiyasu";
import { NON_JA_LOCALES } from "@/i18n/locales";

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

    it.each([...NON_JA_LOCALES])("%s/ 配下の warn 内容の記事は失敗に含まれないこと", (l) => {
      expect(python).not.toBeNull();
      const root = path.join(tmpDir, `content-${l}`);
      const abs = path.join(root, l, "guide", "warn.mdx");
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, read(WARN_SAMPLE) + "う", "utf-8");
      const failures = collectLintFailures({
        contentRoot: root,
        baseline: { ...tempBaseline, files: {} },
        python: python as string,
      });
      expect(failures).toEqual([]);
    }, 120_000);
  });

  describe("frontmatter（title / description）の lint", () => {
    const FM_LABEL = " の frontmatter（title / description）";
    const passBody = matter(read(PASS_SAMPLE)).content.trim();
    const article = (fm: string, body: string = passBody) => `---\n${fm}\n---\n\n${body}\n`;
    const okFm = 'title: "検査用の記事"\ndescription: "yomiyasu lint を通ることを確かめるための固定サンプルです。"';

    // 一時の content ツリーに files を置いて collectLintFailures を実行し、失敗メッセージを返す
    const run = (name: string, files: Record<string, string>, baseline: Baseline = { ...tempBaseline, files: {} }) => {
      expect(python).not.toBeNull();
      const root = path.join(tmpDir, name);
      for (const [rel, body] of Object.entries(files)) {
        const abs = path.join(root, ...rel.split("/"));
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, body, "utf-8");
      }
      return collectLintFailures({ contentRoot: root, baseline, python: python as string });
    };

    it("title にダッシュを含む記事は frontmatter の失敗 1 件だけになり、本文の失敗は含まれないこと", () => {
      const failures = run("fm-title", {
        "blog/dash-title.mdx": article(`title: "QRコードの作り方 — 初心者向け"\ndescription: "固定サンプルです。"`),
      });
      expect(failures).toHaveLength(1);
      expect(failures[0]).toContain(`src/content/blog/dash-title.mdx${FM_LABEL}`);
    }, 120_000);

    it("description にダッシュを含む記事も frontmatter の失敗 1 件だけになること", () => {
      const failures = run("fm-desc", {
        "blog/dash-desc.mdx": article(`title: "検査用の記事"\ndescription: "作り方 — 初心者向けの説明です。"`),
      });
      expect(failures).toHaveLength(1);
      expect(failures[0]).toContain(`src/content/blog/dash-desc.mdx${FM_LABEL}`);
    }, 120_000);

    it("title / description が両方通る記事（pass-sample）は失敗に含まれないこと", () => {
      expect(run("fm-pass", { "blog/pass.mdx": read(PASS_SAMPLE) })).toEqual([]);
    }, 120_000);

    it("title / description が無い記事でも落ちず、本文だけで判定されること", () => {
      const failures = run("fm-empty", {
        "blog/no-fm-pass.mdx": article('category: "test"'),
        "blog/no-fm-warn.mdx": article('category: "test"', matter(read(WARN_SAMPLE)).content.trim()),
      });
      const keys = failures.map((m) => m.split(" ")[0]);
      expect(keys).toEqual(["src/content/blog/no-fm-warn.mdx"]);
      expect(failures.some((m) => m.includes(FM_LABEL))).toBe(false);
    }, 120_000);

    it("en/ 配下の title にダッシュを含む記事は対象外のままであること", () => {
      const failures = run("fm-en", {
        "en/blog/dash-title.mdx": article(`title: "How to make — for beginners"\ndescription: "固定サンプルです。"`),
      });
      expect(failures).toEqual([]);
    }, 120_000);

    it("基準と同ハッシュの記事は title にダッシュがあっても対象外のままであること", () => {
      const content = article(`title: "QRコードの作り方 — 初心者向け"\ndescription: "固定サンプルです。"`);
      const baseline: Baseline = {
        yomiyasuVersion: "test",
        note: "test",
        files: { "src/content/blog/baselined-dash.mdx": hashContent(content) },
      };
      expect(run("fm-baselined", { "blog/baselined-dash.mdx": content }, baseline)).toEqual([]);
    }, 120_000);

    it("ダッシュを含まない title / description を持つ記事（自前で組み立てた形）は失敗しないこと", () => {
      expect(run("fm-ok", { "blog/ok.mdx": article(okFm) })).toEqual([]);
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
      // M4（設計書 9.2）: es / pt-br / de も増えたので、en を含む ja 以外の全言語の分が減る
      const enCount = all.filter((p) => NON_JA_DIRS.some((d) => p.startsWith(`src/content/${d}`))).length;
      expect(enCount).toBeGreaterThan(all.filter((p) => p.startsWith("src/content/en/")).length);
      expect(ja.length).toBe(all.length - enCount);
    });

    // 設計書 9.2: 除外するディレクトリは NON_JA_LOCALES から作る
    it("除外するディレクトリが NON_JA_LOCALES と一致すること", () => {
      expect([...NON_JA_DIRS]).toEqual(NON_JA_LOCALES.map((l) => `${l}/`));
      const all = listMdx(path.join(ROOT, "src/content"));
      const ja = listJapaneseArticles();
      for (const l of NON_JA_LOCALES) {
        expect(ja.filter((p) => p.startsWith(`src/content/${l}/`))).toEqual([]);
      }
      expect(ja.length).toBe(all.filter((p) => !NON_JA_DIRS.some((d) => p.startsWith(`src/content/${d}`))).length);
    });

    it("src/content 直下の言語っぽいディレクトリは NON_JA_LOCALES に含まれること", () => {
      // 言語でないディレクトリが黙って除外されるのを防ぐ。逆に、言語ディレクトリの登録漏れで日本語として lint されるのも防ぐ
      const dirs = fs
        .readdirSync(path.join(ROOT, "src/content"), { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .filter((n) => /^[a-z]{2}(-[a-z]{2,3})?$/.test(n));
      expect(dirs.sort()).toEqual([...NON_JA_LOCALES].sort());
    });

    // 除外ロジック（isNonJaPath）を使わずに、ja の取りこぼしを検出する
    it("基準（baseline.json）のキーがすべて listJapaneseArticles() に含まれること", () => {
      const listed = new Set(listJapaneseArticles());
      const keys = Object.keys(loadBaseline().files);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys.filter((k) => !listed.has(k))).toEqual([]);
    });

    it.each(["guide", "blog", "use-cases"])("src/content/%s の記事が 1 件以上列挙されること", (dir) => {
      expect(listJapaneseArticles().filter((p) => p.startsWith(`src/content/${dir}/`)).length).toBeGreaterThan(0);
    });

    it.each([
      ["es/guide/x.mdx", true],
      ["pt-br/blog/x.mdx", true],
      ["de/guide/x.mdx", true],
      ["en/guide/x.mdx", true],
      ["src/content/de/guide/x.mdx", true],
      ["src/content/es/x.mdx", true],
      ["src/content/guide/x.mdx", false],
      ["src/content/blog/x.mdx", false],
      ["designs/x.mdx", false],
      ["deck/x.mdx", false],
      ["esports/x.mdx", false],
      ["es-foo/x.mdx", false],
      ["src/content/designs/x.mdx", false],
      ["src/content/esports/x.mdx", false],
    ])("isNonJaPath(%j) は %s", (rel, expected) => {
      expect(isNonJaPath(rel)).toBe(expected);
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
