import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getDict } from "@/i18n/getDict";
import type { NonJaLocale } from "@/i18n/locales";
import {
  GUIDE_REQUIRED_TERMS,
  TERM_ANCHORS,
  TERM_IDS,
  type Glossary,
  type TermId,
} from "@/i18n/glossary/terms";

// 訳語テストの共通処理（doc/design/i18n-multi.md 10.3 節）。
// 各翻訳タスクが tests/unit/i18n/glossary.{locale}.test.ts から checkGlossary を呼ぶ。
// 戻り値は失敗メッセージの配列。空なら合格。

const JAPANESE = /[　-〿぀-ゟ゠-ヿ一-鿿＀-￯]/;
const SYMBOLS = ["PNG", "SVG", "PDF", "UTM", "URL"] as const;

/**
 * 仮名・漢字を含まなくてよい例外（M5 で消す切り替え UI の旧キー。自言語名を日本語で出す）
 * TODO: M5 で common.languageSwitch.label のキーを消すとき、この例外も一緒に消す
 */
const KANA_EXEMPT_KEYS = new Set(["common.languageSwitch.label"]);

export interface CheckGlossaryOptions {
  /** 呼びかけの禁止（du / tu など）。大文字小文字を区別する正規表現（glossary/{locale}.ts の addressForbidden） */
  addressForbidden?: readonly RegExp[];
  /** 禁止語の照合で大文字小文字を区別する（de の Sie / sie など）。既定は区別しない */
  caseSensitiveForbidden?: boolean;
}

/** 語の境界（文字・数字の切れ目）つきで照合する正規表現を作る */
export function wordRegExp(word: string, caseSensitive = false): RegExp {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, caseSensitive ? "u" : "iu");
}

/** 辞書の葉（文字列）を「a.b.c」形式のキーと値で列挙する。配列は添字をキーに含める */
export function flattenDict(value: unknown, prefix = ""): { key: string; value: string }[] {
  if (typeof value === "string") return [{ key: prefix, value }];
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => flattenDict(v, `${prefix}.${i}`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => flattenDict(v, prefix ? `${prefix}.${k}` : k));
  }
  return [];
}

/** `{n}` や `{label}` の集合（重複を除いて整列） */
export function placeholders(text: string): string[] {
  return [...new Set(Array.from(text.matchAll(/\{(\w+)\}/g), (m) => m[1]))].sort();
}

/** 言語のガイド MDX（slug 違いも含む）の本文と frontmatter を連結した文字列を返す */
export function readGuideTexts(locale: NonJaLocale, root = process.cwd()): { file: string; text: string }[] {
  const dir = path.join(root, "src/content", locale, "guide");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const { data, content } = matter(raw);
      const front = [data.title, data.description].filter((v) => typeof v === "string").join("\n");
      return { file: `src/content/${locale}/guide/${f}`, text: `${front}\n${content}` };
    });
}

export function checkGlossary(
  locale: NonJaLocale,
  glossary: Glossary,
  options: CheckGlossaryOptions = {}
): string[] {
  const failures: string[] = [];
  const { addressForbidden = [], caseSensitiveForbidden = false } = options;
  const dictLeaves = flattenDict(getDict(locale));
  const byKey = new Map(dictLeaves.map((l) => [l.key, l.value]));
  const enLeaves = flattenDict(getDict("en"));
  const jaByKey = new Map(flattenDict(getDict("ja")).map((l) => [l.key, l.value]));
  const guides = readGuideTexts(locale);

  // 空振り防止: 辞書とガイドが読めている
  if (dictLeaves.length === 0) failures.push("辞書の葉が 0 件");
  if (guides.length === 0) failures.push(`src/content/${locale}/guide に MDX が無い`);

  // 禁止語: 辞書の全値、ガイド MDX の本文と frontmatter
  const targets = [
    ...dictLeaves.map((l) => ({ where: `辞書 ${l.key}`, text: l.value })),
    ...guides.map((g) => ({ where: g.file, text: g.text })),
  ];
  for (const id of TERM_IDS) {
    for (const word of glossary[id].forbidden) {
      const re = wordRegExp(word, caseSensitiveForbidden);
      for (const t of targets) {
        if (re.test(t.text)) failures.push(`禁止語「${word}」(${id}) が ${t.where} にある`);
      }
    }
  }
  for (const original of addressForbidden) {
    // g / y フラグ付きの RegExp は .test() が lastIndex を持ち越すので、フラグを外して複製して使う
    const re = new RegExp(original.source, original.flags.replace(/[gy]/g, ""));
    for (const t of targets) {
      if (re.test(t.text)) failures.push(`呼びかけの禁止語 ${re} が ${t.where} にある`);
    }
  }

  // 必須語: TERM_ANCHORS の辞書キー
  for (const [id, keys] of Object.entries(TERM_ANCHORS) as [TermId, readonly string[]][]) {
    const re = wordRegExp(glossary[id].term);
    for (const key of keys) {
      const value = byKey.get(key);
      if (value === undefined) failures.push(`TERM_ANCHORS のキー ${key} (${id}) が辞書に無い`);
      else if (!re.test(value)) failures.push(`${key} の値「${value}」に訳語「${glossary[id].term}」(${id}) が無い`);
    }
  }

  // ガイドの訳語: qrCode / utmParameters / download が 1 回以上
  for (const g of guides) {
    for (const id of GUIDE_REQUIRED_TERMS) {
      if (!wordRegExp(glossary[id].term).test(g.text)) {
        failures.push(`${g.file} に訳語「${glossary[id].term}」(${id}) が無い`);
      }
    }
  }

  // 記号のそろい: en の値に PNG / SVG / PDF / UTM / URL が入るキーは、その言語の値にも入る
  for (const { key, value } of enLeaves) {
    const own = byKey.get(key);
    if (own === undefined) continue;
    for (const sym of SYMBOLS) {
      if (value.includes(sym) && !own.includes(sym)) failures.push(`${key} に ${sym} が無い（en: ${value}）`);
    }
  }

  // 文字種: 仮名と漢字が無い（辞書、ガイド）
  for (const { key, value } of dictLeaves) {
    if (!KANA_EXEMPT_KEYS.has(key) && JAPANESE.test(value)) failures.push(`辞書 ${key} に日本語の文字がある: ${value}`);
  }
  for (const g of guides) {
    for (const line of g.text.split(/\r?\n/)) {
      if (JAPANESE.test(line)) failures.push(`${g.file} に日本語の文字がある: ${line}`);
    }
  }

  // プレースホルダ: 集合が ja と同じ
  for (const { key, value } of dictLeaves) {
    const ja = jaByKey.get(key);
    if (ja === undefined) continue;
    const a = placeholders(value).join(",");
    const b = placeholders(ja).join(",");
    if (a !== b) failures.push(`${key} のプレースホルダが ja と違う（{${a}} / ja {${b}}）`);
  }

  return failures;
}
