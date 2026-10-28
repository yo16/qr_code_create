import fs from "fs";
import path from "path";
import matter from "gray-matter";

/** de ガイド getting-started の本文チェック（qr_code_create-38x.8）。MDX は描画せず原文を読む */
interface HowToStep {
  name: string;
  text: string;
}

function loadGuide(locale: "de" | "en") {
  const file = path.join(process.cwd(), "src/content", locale, "guide", "getting-started.mdx");
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return {
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    howto: (data.howto ?? []) as HowToStep[],
    body: content,
  };
}

function headings(body: string): string[] {
  return body.split(/\r?\n/).filter((l) => /^#{2,3} /.test(l));
}

/** コードブロック、インラインコード、リンク先、固有名詞、例を取り除いた散文 */
function prose(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/QR Code Create/g, "")
    .replace(/qr code generator/g, "");
}

const FUNCTION_WORDS = /(?<![\p{L}\p{N}_-])(?:the|and|your|with|you|for)(?![\p{L}\p{N}_-])/iu;

const de = loadGuide("de");
const en = loadGuide("en");

describe("de ガイド本文の内部リンク", () => {
  const links = Array.from(de.body.matchAll(/\]\((\/[^)\s]*)\)/g), (m) => m[1]);

  it("内部リンクが 1 件以上ある（空振り防止）", () => {
    expect(links.length).toBeGreaterThan(0);
  });

  it("すべて /de または /de/ で始まり、/create・/en・/ja が混ざらない", () => {
    for (const href of links) {
      expect(href).toMatch(/^\/de(\/|$)/);
    }
    expect(links).not.toContain("/create");
    expect(links.some((h) => /^\/(en|ja)(\/|$)/.test(h))).toBe(false);
  });

  it("検出の確認: en のガイドの内部リンクは /de で始まらない", () => {
    const enLinks = Array.from(en.body.matchAll(/\]\((\/[^)\s]*)\)/g), (m) => m[1]);
    expect(enLinks.length).toBeGreaterThan(0);
    expect(enLinks.every((h) => /^\/de(\/|$)/.test(h))).toBe(false);
  });
});

describe("de ガイドに英語が残っていない", () => {
  it("## ### の見出しの数が en と同じで、1 本も en と一致しない", () => {
    const deH = headings(de.body);
    const enH = headings(en.body);
    expect(deH.length).toBeGreaterThan(0);
    expect(deH.length).toBe(enH.length);
    expect(deH.filter((h) => enH.includes(h))).toEqual([]);
  });

  it("title と description が en と違う", () => {
    expect(de.title).not.toBe("");
    expect(de.description).not.toBe("");
    expect(de.title).not.toBe(en.title);
    expect(de.description).not.toBe(en.description);
  });

  it("howto の件数が en と同じで、各 name と text が en と違う", () => {
    expect(de.howto.length).toBeGreaterThan(0);
    expect(de.howto.length).toBe(en.howto.length);
    de.howto.forEach((step, i) => {
      expect(step.name).not.toBe("");
      expect(step.text).not.toBe("");
      expect(step.name).not.toBe(en.howto[i].name);
      expect(step.text).not.toBe(en.howto[i].text);
    });
  });

  it("本文と frontmatter に英語の機能語が単語として出ない", () => {
    const all = [de.title, de.description, ...de.howto.flatMap((s) => [s.name, s.text]), de.body];
    const offenders = all.map(prose).filter((t) => FUNCTION_WORDS.test(t));
    expect(offenders).toEqual([]);
  });

  it("検出の確認: en のガイドには機能語が出る", () => {
    expect(FUNCTION_WORDS.test(prose(en.body))).toBe(true);
  });
});
