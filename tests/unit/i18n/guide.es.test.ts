import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getDict } from "@/i18n/getDict";
import { esGlossary, addressForbidden } from "@/i18n/glossary/es";
import { checkGlossary, flattenDict, readGuideTexts } from "../../helpers/glossary";

/**
 * es のガイド MDX（qr_code_create-38x.6）。描画テストは next-mdx-remote をモックするので、
 * 本文のリンクと英語の残りはここで MDX の文字列から直接確かめる。
 */

interface HowToStep {
  name: string;
  text: string;
}

function readGuide(locale: "en" | "es", file = "getting-started.mdx") {
  const raw = fs.readFileSync(path.join(process.cwd(), "src/content", locale, "guide", file), "utf8");
  const parsed = matter(raw);
  const data = parsed.data as { title?: string; description?: string; howto?: HowToStep[] };
  return { title: data.title ?? "", description: data.description ?? "", howto: data.howto ?? [], body: parsed.content };
}

const headingLines = (body: string) =>
  body
    .split(/\r?\n/)
    .filter((line) => /^#{2,3}\s/.test(line))
    .map((line) => line.trim());

const es = readGuide("es");
const en = readGuide("en");

describe("es ガイド本文の内部リンク", () => {
  const links = Array.from(es.body.matchAll(/\]\((\/[^)\s]*)\)/g), (m) => m[1]);

  it("内部リンク（](/…) 形式）が 1 件以上ある", () => {
    expect(links.length).toBeGreaterThan(0);
  });

  it("すべて /es または /es/ で始まり、/create・/en・/ja が混ざらない", () => {
    const bad = links.filter((href) => !(href === "/es" || href.startsWith("/es/")));
    expect(bad).toEqual([]);
    expect(links).not.toContain("/create");
    expect(links.filter((h) => /^\/(en|ja)(\/|$)/.test(h))).toEqual([]);
  });

  it("検出用の判定は /es2 や /create を弾く（異常系の確認）", () => {
    const isEs = (h: string) => h === "/es" || h.startsWith("/es/");
    expect(isEs("/es/create")).toBe(true);
    expect(isEs("/es")).toBe(true);
    expect(isEs("/es2")).toBe(false);
    expect(isEs("/create")).toBe(false);
    expect(isEs("/en/create")).toBe(false);
  });
});

describe("es ガイドに英語が残っていない", () => {
  it("見出し（## / ###）の数が en と同じで、1 本も en の見出しと一致しない", () => {
    const esHeads = headingLines(es.body);
    const enHeads = headingLines(en.body);
    expect(esHeads.length).toBeGreaterThan(0);
    expect(esHeads).toHaveLength(enHeads.length);
    expect(esHeads.filter((h) => enHeads.includes(h))).toEqual([]);
  });

  it("frontmatter の title と description が en と違う", () => {
    expect(es.title).not.toBe("");
    expect(es.title).not.toBe(en.title);
    expect(es.description).not.toBe("");
    expect(es.description).not.toBe(en.description);
  });

  it("howto の件数が en と同じで、各 name と text が en と違う", () => {
    expect(es.howto.length).toBeGreaterThan(0);
    expect(es.howto).toHaveLength(en.howto.length);
    es.howto.forEach((step, i) => {
      expect(step.name).not.toBe("");
      expect(step.text).not.toBe("");
      expect(step.name).not.toBe(en.howto[i].name);
      expect(step.text).not.toBe(en.howto[i].text);
    });
  });

  describe("英語の機能語（the / and / your / with / you / for）", () => {
    const FUNCTION_WORDS = /(?<![\p{L}\p{N}_])(the|and|your|with|you|for)(?![\p{L}\p{N}_])/iu;
    /** コード・URL・リンク先を除いた文章だけにする */
    const prose = (text: string) =>
      text
        .replace(/```[\s\S]*?```/g, "")
        .replace(/`[^`]*`/g, "")
        .replace(/\]\([^)]*\)/g, "]")
        .replace(/https?:\/\/\S+/g, "");

    it("検出用の正規表現は機能語を拾い、スペイン語や固有名詞を拾わない", () => {
      expect(FUNCTION_WORDS.test("Enter your URL")).toBe(true);
      expect(FUNCTION_WORDS.test("save the file")).toBe(true);
      expect(FUNCTION_WORDS.test("Escribe tu URL y descarga el código QR")).toBe(false);
      expect(FUNCTION_WORDS.test("QR Code Create")).toBe(false);
      expect(FUNCTION_WORDS.test("forma información")).toBe(false);
    });

    it("辞書の葉に出ない", () => {
      const hits = flattenDict(getDict("es"))
        .filter((l) => FUNCTION_WORDS.test(prose(l.value)))
        .map((l) => `${l.key}: ${l.value}`);
      expect(hits).toEqual([]);
    });

    it("ガイドの本文と frontmatter に出ない", () => {
      const guides = readGuideTexts("es");
      expect(guides.length).toBeGreaterThan(0);
      const hits = guides.flatMap((g) =>
        prose(g.text)
          .split(/\r?\n/)
          .filter((line) => FUNCTION_WORDS.test(line))
          .map((line) => `${g.file}: ${line}`)
      );
      expect(hits).toEqual([]);
    });
  });
});

describe("checkGlossary の異常系（es）", () => {
  it("禁止語に実在の訳語（código QR）を入れた用語集は失敗を返す", () => {
    const glossary = { ...esGlossary, qrCode: { term: "código QR", forbidden: ["código QR"] } };
    const failures = checkGlossary("es", glossary, { addressForbidden });
    expect(failures.some((f) => f.includes("禁止語「código QR」(qrCode)"))).toBe(true);
    expect(failures.some((f) => f.includes("辞書"))).toBe(true);
    expect(failures.some((f) => f.includes("src/content/es/guide/"))).toBe(true);
  });

  it("訳語が辞書に入っていない用語集は失敗を返す", () => {
    const glossary = { ...esGlossary, logo: { term: "zzqx", forbidden: [] } };
    const failures = checkGlossary("es", glossary, { addressForbidden });
    expect(failures.some((f) => f.includes("zzqx"))).toBe(true);
  });
});
