import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { ptBr } from "@/i18n/ptBr";
import { flattenDict, readGuideTexts } from "../../helpers/glossary";

/**
 * pt-br ガイド本文（qr_code_create-38x.7）の検査。
 * 描画テストは MDX をモックするため、本文のリンクと英語の取り残しをここで見る。
 */

const guideFile = (locale: string) =>
  path.join(process.cwd(), "src/content", locale, "guide", "getting-started.mdx");
const read = (locale: string) => matter(fs.readFileSync(guideFile(locale), "utf8"));

interface HowToStep {
  name: string;
  text: string;
}
const howtoOf = (data: Record<string, unknown>) => (data.howto ?? []) as HowToStep[];

const headingsOf = (content: string) =>
  content
    .split(/\r?\n/)
    .filter((l) => /^#{2,3}\s/.test(l))
    .map((l) => l.trim());

/** 英語の機能語の検査から、コード・URL・リンク先・固有名詞を除いた文字列 */
function stripNonProse(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\]\([^)]*\)/g, "] ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/QR Code Create/g, " ");
}
const ENGLISH_WORDS = /(?<![\p{L}\p{N}_])(the|and|your|with|you)(?![\p{L}\p{N}_])/iu;
const englishHits = (text: string) =>
  stripNonProse(text)
    .split(/\r?\n/)
    .filter((l) => ENGLISH_WORDS.test(l));

describe("pt-br ガイド本文の内部リンク", () => {
  const guides = readGuideTexts("pt-br");
  const links = guides.flatMap((g) =>
    Array.from(g.text.matchAll(/\]\((\/[^)\s]*)\)/g), (m) => ({ file: g.file, href: m[1] }))
  );

  it("本文に内部リンクがある（空振り防止）", () => {
    expect(guides.length).toBeGreaterThan(0);
    expect(links.length).toBeGreaterThan(0);
  });

  it("内部リンクはすべて /pt-br か /pt-br/ で始まり、/create・/en・/ja が混ざらない", () => {
    const bad = links.filter((l) => l.href !== "/pt-br" && !l.href.startsWith("/pt-br/"));
    expect(bad).toEqual([]);
    expect(links.map((l) => l.href)).toContain("/pt-br/create");
  });

  it("検出用の判定が /create や /en/create を弾く", () => {
    const ok = (h: string) => h === "/pt-br" || h.startsWith("/pt-br/");
    expect(ok("/create")).toBe(false);
    expect(ok("/en/create")).toBe(false);
    expect(ok("/pt-brx")).toBe(false);
    expect(ok("/pt-br/create")).toBe(true);
  });
});

describe("pt-br ガイドの英語残り", () => {
  const pt = read("pt-br");
  const en = read("en");

  it("## / ### の見出しの数が en と同じで、en と一致する見出しが 1 本も無い", () => {
    const ptH = headingsOf(pt.content);
    const enH = headingsOf(en.content);
    expect(ptH.length).toBeGreaterThan(0);
    expect(ptH.length).toBe(enH.length);
    expect(ptH.filter((h) => enH.includes(h))).toEqual([]);
  });

  it("title と description が en と違う", () => {
    expect(pt.data.title).toBeTruthy();
    expect(pt.data.title).not.toBe(en.data.title);
    expect(pt.data.description).toBeTruthy();
    expect(pt.data.description).not.toBe(en.data.description);
  });

  it("howto の件数が en と同じで、各 name と text が en と違う", () => {
    const ptS = howtoOf(pt.data);
    const enS = howtoOf(en.data);
    expect(ptS.length).toBeGreaterThan(0);
    expect(ptS.length).toBe(enS.length);
    ptS.forEach((step, i) => {
      expect(step.name).not.toBe(enS[i].name);
      expect(step.text).not.toBe(enS[i].text);
    });
  });

  it("ガイド本文に英語の機能語 the / and / your / with / you が出ない", () => {
    const hits = readGuideTexts("pt-br").flatMap((g) => englishHits(g.text).map((l) => `${g.file}: ${l}`));
    expect(hits).toEqual([]);
  });

  it("辞書の葉に英語の機能語 the / and / your / with / you が出ない", () => {
    const hits = flattenDict(ptBr)
      .filter((l) => englishHits(l.value).length > 0)
      .map((l) => `${l.key}: ${l.value}`);
    expect(hits).toEqual([]);
  });

  // 異常系: 検査が空振りしていない
  it("英語文は検出し、ポルトガル語文と固有名詞・リンク先は検出しない", () => {
    expect(englishHits("Enter your URL and download").length).toBe(1);
    expect(englishHits("Se for preciso, baixe o arquivo")).toEqual([]);
    expect(englishHits("Abra o [guia](https://example.com/the-and-you) do QR Code Create")).toEqual([]);
  });
});
