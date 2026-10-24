/**
 * @jest-environment node
 */
// getGuide / getGuideSlugList の locale 引数（qr_code_create-01z.5）。
// locale 省略で従来どおり ja を読み、"en" で src/content/en/guide を読む。
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";

const JA_DIR = path.join(process.cwd(), "src/content/guide");
const JAPANESE = /[぀-ゟ゠-ヿ一-鿿]/;

describe("getGuide / getGuideSlugList の locale 省略（従来どおり）", () => {
  // 意図: 既定値は ja。src/content/guide の MDX 一覧と一致し、"ja" 明示とも同じ
  it("getGuideSlugList() は src/content/guide の .mdx 一覧と一致し、getGuideSlugList(\"ja\") と同じ", () => {
    const expected = fs
      .readdirSync(JA_DIR)
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.replace(/\.mdx$/, ""));
    expect(getGuideSlugList()).toEqual(expected);
    expect(getGuideSlugList("ja")).toEqual(expected);
    expect(expected).toContain("getting-started");
    expect(expected).toContain("utm-setup");
  });

  // 意図: locale 省略の getGuide は ja の MDX の frontmatter と本文をそのまま返す
  it("getGuide(\"getting-started\") は ja の MDX の内容を返し、\"ja\" 明示と同じ", () => {
    const raw = matter(fs.readFileSync(path.join(JA_DIR, "getting-started.mdx"), "utf8"));
    const guide = getGuide("getting-started");
    expect(guide).not.toBeNull();
    expect(guide?.title).toBe(raw.data.title);
    expect(guide?.description).toBe(raw.data.description);
    expect(guide?.content).toBe(raw.content);
    expect(guide?.slug).toBe("getting-started");
    expect(guide?.title).toMatch(JAPANESE);
    expect(getGuide("getting-started", "ja")).toEqual(guide);
  });
});

describe("getGuide(slug, \"en\")", () => {
  const ja = getGuide("getting-started", "ja")!;
  const en = getGuide("getting-started", "en");

  // 意図: en は英語の MDX を返し、日本語が混ざらない
  it("英語の title / description / 本文を返し、仮名・漢字を含まない", () => {
    expect(en).not.toBeNull();
    expect(en?.slug).toBe("getting-started");
    expect(en?.title).toContain("Getting started");
    expect(en?.title).not.toMatch(JAPANESE);
    expect(en?.description).not.toMatch(JAPANESE);
    expect(en?.content).not.toMatch(JAPANESE);
    expect(en?.title).not.toBe(ja.title);
  });

  // 意図: frontmatter のキーは ja と同じ（GuideFrontmatter を変えない）
  it("frontmatter のキー集合が ja と同じ", () => {
    const keysOf = (g: object) => Object.keys(g).filter((k) => k !== "content").sort();
    expect(keysOf(en!)).toEqual(keysOf(ja));
  });

  // 意図: HowTo 用の howto を持ち、ステップ数は ja と同じ。各ステップは英語
  it("howto が ja と同数のステップで、name / text が英語", () => {
    expect(en?.howto).toBeDefined();
    expect(en?.howto).toHaveLength(ja.howto!.length);
    en!.howto!.forEach((step) => {
      expect(step.name).toBeTruthy();
      expect(step.text).toBeTruthy();
      expect(step.name).not.toMatch(JAPANESE);
      expect(step.text).not.toMatch(JAPANESE);
    });
  });

  // 意図: date は ISO 文字列のまま（ロケール整形しない）
  it("date が YYYY-MM-DD の文字列", () => {
    expect(en?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("異常系", () => {
  // 意図: ja にだけあるガイドは en では null（/en/guide/utm-setup を作らない）
  it("en に無い slug（utm-setup）は en で null、ja では存在する", () => {
    expect(getGuide("utm-setup", "ja")).not.toBeNull();
    expect(getGuide("utm-setup", "en")).toBeNull();
  });

  // 意図: 存在しない slug は ja / en とも null
  it.each(["ja", "en"] as const)("存在しない slug は %s で null", (locale) => {
    expect(getGuide("nonexistent-slug", locale)).toBeNull();
  });
});

describe("getGuideSlugList(\"en\")", () => {
  // 意図: T4 時点の英語ガイドは getting-started の 1 本だけ
  it('["getting-started"] を返す', () => {
    expect(getGuideSlugList("en")).toEqual(["getting-started"]);
  });
});
