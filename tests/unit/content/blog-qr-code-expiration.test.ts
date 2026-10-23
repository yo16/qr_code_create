import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getBlog, getBlogSlugList } from "@/lib/content/getBlog";

// 対象記事: 「QRコードに有効期限はある？」(qr_code_create-31c)
const SLUG = "qr-code-expiration";
const MDX_PATH = path.join(process.cwd(), "src/content/blog", `${SLUG}.mdx`);

// yomiyasu スキル（文章の読みやすさリンター）の配置先
const YOMIYASU_DIR = path.join(process.cwd(), ".claude/skills/yomiyasu");
const YOMIYASU_SKILL_MD = path.join(YOMIYASU_DIR, "SKILL.md");
const YOMIYASU_LINT_PY = path.join(YOMIYASU_DIR, "scripts/yomiyasu_lint.py");

// 本文文字数の許容範囲（frontmatter を除き、空白を除去して数える）
const MIN_BODY_CHARS = 1200;
const MAX_BODY_CHARS = 3500;

/**
 * 記事ファイルを読み込み frontmatter と本文を返す。
 * ファイルが無い場合は空の frontmatter と空文字の本文を返し、
 * beforeAll の例外で suite 全体が "failed to run" にならないようにする。
 */
function loadArticle(): { data: Record<string, unknown>; content: string } {
  if (!fs.existsSync(MDX_PATH)) {
    return { data: {}, content: "" };
  }
  const parsed = matter(fs.readFileSync(MDX_PATH, "utf-8"));
  return { data: parsed.data as Record<string, unknown>, content: parsed.content };
}

/** 行頭 `## ` で始まる h2 見出しのテキスト一覧を抽出する */
function extractH2Headings(content: string): string[] {
  return content
    .split(/\r?\n/)
    .filter((line) => /^## /.test(line))
    .map((line) => line.replace(/^## /, "").trim());
}

describe("ブログ記事: qr-code-expiration（QRコードに有効期限はある？）", () => {
  it("記事ファイル src/content/blog/qr-code-expiration.mdx が存在すること", () => {
    // 意図: 記事の配置先とファイル名（slug）が契約どおりであることを確認する
    expect(fs.existsSync(MDX_PATH)).toBe(true);
  });

  describe("frontmatter", () => {
    let data: Record<string, unknown>;

    beforeAll(() => {
      data = loadArticle().data;
    });

    it("title に「QRコードに有効期限はある？」が含まれること", () => {
      // 意図: 検索意図に合致した記事タイトルが設定されていることを確認する
      expect(typeof data.title).toBe("string");
      expect(data.title as string).toContain("QRコードに有効期限はある？");
    });

    it("description が非空の文字列であること", () => {
      // 意図: 一覧ページや meta description で使う要約が空でないことを確認する
      expect(typeof data.description).toBe("string");
      expect((data.description as string).trim().length).toBeGreaterThan(0);
    });

    it("date が YYYY-MM-DD 形式であること", () => {
      // 意図: 日付のソートや表示に使える形式で記述されていることを確認する
      expect(typeof data.date).toBe("string");
      expect(data.date as string).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("category が qr-marketing であること", () => {
      // 意図: 記事がマーケティング活用カテゴリに分類されていることを確認する
      expect(data.category).toBe("qr-marketing");
    });
  });

  describe("本文の構成", () => {
    let content: string;
    let h2Headings: string[];

    beforeAll(() => {
      content = loadArticle().content;
      h2Headings = extractH2Headings(content);
    });

    it("「静的」を含む h2 見出しが 1 つ以上あること", () => {
      // 意図: 静的QRコード（有効期限なし）の説明セクションがあることを確認する
      const matched = h2Headings.filter((h) => h.includes("静的"));
      expect(matched.length).toBeGreaterThanOrEqual(1);
    });

    it("「動的」を含む h2 見出しが 1 つ以上あること", () => {
      // 意図: 動的QRコード（サービス依存で失効しうる）の説明セクションがあることを確認する
      const matched = h2Headings.filter((h) => h.includes("動的"));
      expect(matched.length).toBeGreaterThanOrEqual(1);
    });

    it("本文に /create への Markdown リンクが 1 つ以上あること", () => {
      // 意図: 記事から作成ページへ誘導する内部リンク（CTA）があることを確認する
      const links = content.match(/\]\(\/create\)/g) ?? [];
      expect(links.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("本文の分量", () => {
    let bodyCharCount: number;

    beforeAll(() => {
      // 空白（改行・スペース）を除いた文字数で数える
      bodyCharCount = loadArticle().content.replace(/\s/g, "").length;
    });

    it(`本文（frontmatter を除く）が ${MIN_BODY_CHARS} 字以上であること`, () => {
      // 意図: 検索意図に十分に答える分量があることを確認する（薄い記事の防止）
      expect(bodyCharCount).toBeGreaterThanOrEqual(MIN_BODY_CHARS);
    });

    it(`本文（frontmatter を除く）が ${MAX_BODY_CHARS} 字以下であること`, () => {
      // 意図: 読み切れる分量に収まっていることを確認する（冗長な記事の防止）
      expect(bodyCharCount).toBeLessThanOrEqual(MAX_BODY_CHARS);
    });
  });

  describe("本文に含めない語", () => {
    let content: string;

    beforeAll(() => {
      content = loadArticle().content;
    });

    it("「AI」の語を含まないこと", () => {
      // 意図: 記事テーマ（有効期限）と無関係な AI への言及が混入していないことを確認する
      // \b で区切ることで MAIL 等の英単語の一部にはマッチさせない
      expect(content).not.toMatch(/\bAI\b/);
    });

    it("「ChatGPT」の語を含まないこと", () => {
      // 意図: 記事テーマと無関係な ChatGPT への言及が混入していないことを確認する
      expect(content).not.toMatch(/ChatGPT/i);
    });

    it("文字化け（U+FFFD）を含まないこと", () => {
      // 意図: エンコーディング不備で置換文字が混入していないことを確認する
      expect(content).not.toMatch(/�/);
    });
  });

  describe("getBlog 統合", () => {
    it("getBlog(slug) が null でなく、各フィールドを持つこと", () => {
      // 意図: 記事ページの生成に必要なフィールドがすべて取得できることを確認する
      const result = getBlog(SLUG);
      expect(result).not.toBeNull();
      expect(result?.slug).toBe(SLUG);
      expect(typeof result?.title).toBe("string");
      expect(result?.title).toContain("QRコードに有効期限はある？");
      expect(typeof result?.description).toBe("string");
      expect((result?.description ?? "").length).toBeGreaterThan(0);
      expect(result?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result?.category).toBe("qr-marketing");
      expect(typeof result?.content).toBe("string");
      expect((result?.content ?? "").length).toBeGreaterThan(0);
    });

    it("getBlogSlugList() に slug が含まれること", () => {
      // 意図: 一覧ページと generateStaticParams の対象に記事が含まれることを確認する
      expect(getBlogSlugList()).toContain(SLUG);
    });
  });
});

describe("yomiyasu スキル導入", () => {
  it(".claude/skills/yomiyasu/SKILL.md が存在すること", () => {
    // 意図: 読みやすさチェック用スキルの定義ファイルが導入されていることを確認する
    expect(fs.existsSync(YOMIYASU_SKILL_MD)).toBe(true);
  });

  it(".claude/skills/yomiyasu/scripts/yomiyasu_lint.py が存在すること", () => {
    // 意図: スキルが呼び出すリンタースクリプトが同梱されていることを確認する
    expect(fs.existsSync(YOMIYASU_LINT_PY)).toBe(true);
  });
});
