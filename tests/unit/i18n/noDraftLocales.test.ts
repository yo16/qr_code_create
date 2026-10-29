/**
 * @jest-environment node
 */
// 下書き検出（qr_code_create-38x.9）: M4 で es / pt-br / de に置いた「en の写し」が、本番反映の前に残っていないことを止める。
// - 辞書の葉のうち en と同じ値の割合が小さい（許可語を除く）
// - schema.inLanguage がその言語
// - ガイドの MDX が en と同一でない（title / description / 本文）
// 自己検査: 合成した「en の写し」の辞書とガイドでは、同じ判定が落ちる（検出が素通りしない）。
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";
import { ptBr } from "@/i18n/ptBr";
import { de } from "@/i18n/de";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";
import type { Dict } from "@/i18n/types";

type Target = "es" | "pt-br" | "de";
const DICTS: Record<Target, Dict> = { es, "pt-br": ptBr, de };
const TARGETS: readonly Target[] = ["es", "pt-br", "de"];

/** 翻訳しても英語と同じになる語（製品名・形式名・固有名詞・記号類）。大文字小文字を区別して完全一致 */
const ALLOWED_SAME = new Set<string>([
  "QR Code Create",
  "URL",
  "PNG",
  "SVG",
  "PDF",
  "FAQ",
  "Blog",
  "UTM",
  "Google Analytics",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "https://example.com",
  "Logo: {fileName}",
  // 実測（2026-10）で en と同じ綴りになる語。各言語で通用する借用語・同形語（フレームやプリセットの名前など）
  "Simple",
  "Pop",
  "Casual",
  "Flyer",
  "Poster",
  "Business",
  "Elegant",
  "Standard",
  "Tabs",
]);

/**
 * 許可語を除いた同値の葉の割合の上限。実測は 0 件なので 0。写しに戻ると 90% 以上になる。
 * 将来、翻訳しても en と同じになる語が出たら、上限を上げずに ALLOWED_SAME に足す。
 */
const MAX_SAME_RATIO = 0;

function leaves(value: unknown, prefix = ""): [string, string][] {
  if (typeof value === "string") return [[prefix, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${prefix}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
  }
  return [];
}

/** 文字列でない値や、記号・数字・空だけの値は翻訳の対象外 */
function isTranslatable(v: string): boolean {
  return /\p{L}{2,}/u.test(v) && !ALLOWED_SAME.has(v.trim());
}

function sameLeaves(dict: Dict, base: Dict): { total: number; same: string[] } {
  const baseMap = new Map(leaves(base));
  const own = leaves(dict).filter(([k]) => baseMap.has(k));
  const same = own.filter(([k, v]) => v === baseMap.get(k) && isTranslatable(v)).map(([k]) => k);
  return { total: own.filter(([, v]) => isTranslatable(v) || /\p{L}{2,}/u.test(v)).length, same };
}

function loadGuide(locale: "en" | Target) {
  const file = path.join(process.cwd(), "src", "content", locale, "guide", "getting-started.mdx");
  return fs.readFileSync(file, "utf8");
}

/** 本文の段落（空行区切り、コードブロックを除く）。文字を含まない段落は除く */
function paragraphs(body: string): string[] {
  return body
    .replace(/```[\s\S]*?```/g, "")
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter((p) => /\p{L}{2,}/u.test(p));
}

/** en の写しの名残の理由。title / description が en と同じ、または本文の段落が en と完全一致するもの */
function guideDraftReasons(candidate: string, enSource: string): string[] {
  const c = matter(candidate);
  const e = matter(enSource);
  const reasons: string[] = [];
  if (String(c.data.title ?? "") === String(e.data.title ?? "")) reasons.push("title");
  if (String(c.data.description ?? "") === String(e.data.description ?? "")) reasons.push("description");
  const enParas = new Set(paragraphs(e.content));
  for (const p of paragraphs(c.content)) if (enParas.has(p)) reasons.push(`paragraph: ${p.slice(0, 40)}`);
  return reasons;
}

describe("下書き（en の写し）が辞書に残っていない", () => {
  it.each(TARGETS)("%s: 許可語を除いて en と同じ値の葉の割合が上限以下", (locale) => {
    const { total, same } = sameLeaves(DICTS[locale], en);
    expect(total).toBeGreaterThan(100); // 空振り防止: 比較した葉が十分ある
    // 失敗時にどのキーが同じかを見られるよう、キー一覧ごと比べる
    expect({ locale, overLimit: same.length / total > MAX_SAME_RATIO, same }).toEqual({
      locale,
      overLimit: false,
      same,
    });
  });

  it.each(TARGETS)("%s: schema.inLanguage が %s の hreflang / htmlLang どちらかと一致", (locale) => {
    const dict = DICTS[locale];
    expect([LOCALE_CONFIG[locale].hreflang, LOCALE_CONFIG[locale].htmlLang]).toContain(dict.schema.inLanguage);
    expect(dict.schema.inLanguage).not.toBe(en.schema.inLanguage);
  });

  it.each(TARGETS)("%s: title / description / hero の主要文言が en と違う", (locale) => {
    const d = DICTS[locale];
    expect(d.meta.pages.home.description).not.toBe(en.meta.pages.home.description);
    expect(d.meta.pages.create.description).not.toBe(en.meta.pages.create.description);
    expect(d.home.hero.description).not.toBe(en.home.hero.description);
    expect(d.tool.pageHeading).not.toBe(en.tool.pageHeading);
  });
});

describe("下書き（en の写し）がガイドに残っていない", () => {
  it.each(TARGETS)("%s: getting-started.mdx が en と同一でない", (locale) => {
    const own = loadGuide(locale);
    expect(own.length).toBeGreaterThan(0);
    expect(own).not.toBe(loadGuide("en"));
  });

  it.each(TARGETS)("%s: title / description が en と違い、en と完全一致する本文の段落が 0 件", (locale) => {
    const own = loadGuide(locale);
    expect(String(matter(own).data.title ?? "")).not.toBe("");
    expect(paragraphs(matter(own).content).length).toBeGreaterThan(3); // 空振り防止
    expect(guideDraftReasons(own, loadGuide("en"))).toEqual([]);
  });
});

describe("自己検査: M4 の下書き（en の写し）に戻したら落ちる", () => {
  it("en の写しの辞書は、同値の葉の割合が上限を超える", () => {
    const copy: Dict = JSON.parse(JSON.stringify(en)) as Dict;
    const { total, same } = sameLeaves(copy, en);
    expect(same.length / total).toBeGreaterThan(MAX_SAME_RATIO);
  });

  it("en の写しの辞書は、schema.inLanguage が自言語にならない", () => {
    const copy: Dict = JSON.parse(JSON.stringify(en)) as Dict;
    expect(copy.schema.inLanguage).not.toBe(LOCALE_CONFIG.de.hreflang);
  });

  it("一部の葉だけ en に戻しても、割合が上限を超える量なら検出される", () => {
    const partial: Dict = JSON.parse(JSON.stringify(de)) as Dict;
    partial.home = JSON.parse(JSON.stringify(en.home)) as Dict["home"];
    partial.tool = JSON.parse(JSON.stringify(en.tool)) as Dict["tool"];
    const { total, same } = sameLeaves(partial, en);
    expect(same.length / total).toBeGreaterThan(MAX_SAME_RATIO);
  });

  it("en と同一のガイドは、title・description・全段落が写しと判定される", () => {
    const enSource = loadGuide("en");
    const reasons = guideDraftReasons(enSource, enSource);
    expect(reasons).toContain("title");
    expect(reasons).toContain("description");
    expect(reasons.filter((r) => r.startsWith("paragraph:")).length).toBe(paragraphs(matter(enSource).content).length);
  });

  it("title だけ en に戻した合成ガイドは落ちる（他は翻訳済み）", () => {
    const de = loadGuide("de");
    const enTitle = String(matter(loadGuide("en")).data.title);
    const m = matter(de);
    const synthetic = matter.stringify(m.content, { ...m.data, title: enTitle });
    expect(guideDraftReasons(synthetic, loadGuide("en"))).toEqual(["title"]);
    expect(guideDraftReasons(de, loadGuide("en"))).toEqual([]); // 対照: 元のガイドは通る
  });

  it("1 段落だけ en に戻した合成ガイドは落ちる（他は翻訳済み）", () => {
    const de = matter(loadGuide("de"));
    const enParas = paragraphs(matter(loadGuide("en")).content);
    const deParas = paragraphs(de.content);
    const target = enParas.find((p) => p.length > 40 && !p.startsWith("#")) as string;
    expect(target).toBeDefined();
    const synthetic = matter.stringify(`${deParas.slice(1).join("\n\n")}\n\n${target}\n`, de.data);
    const reasons = guideDraftReasons(synthetic, loadGuide("en"));
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toBe(`paragraph: ${target.slice(0, 40)}`);
  });

  it("許可語だけが en と同じ辞書は、同値としては数えない", () => {
    const a = { x: "PNG", y: "QR Code Create", z: "Hallo" } as unknown as Dict;
    const b = { x: "PNG", y: "QR Code Create", z: "Hello" } as unknown as Dict;
    const { same } = sameLeaves(a, b);
    expect(same).toEqual([]);
  });
});
