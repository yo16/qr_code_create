import { getDict, getClientMessages } from "@/i18n/getDict";
import { LOCALES } from "@/i18n/locales";
import { flattenDict } from "../../helpers/glossary";

// 完了条件: 全言語の辞書が ja とキー集合で一致し、葉がすべて string。
// LOCALES でループするので、M6〜M8 で言語を足してもそのまま使える。

function leafKeys(value: unknown): string[] {
  return flattenDict(value)
    .map((l) => l.key)
    .sort();
}

/** string 以外の葉（number, boolean, null, undefined など）のパスを集める */
function nonStringLeaves(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return [];
  if (Array.isArray(value)) return value.flatMap((v, i) => nonStringLeaves(v, `${prefix}.${i}`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => nonStringLeaves(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

describe("辞書のキー一致", () => {
  const jaKeys = leafKeys(getDict("ja"));

  it("基準の ja のキー集合が空でない", () => {
    expect(jaKeys.length).toBeGreaterThan(0);
  });

  it.each([...LOCALES])("%s: getDict のキー集合が ja と同一", (l) => {
    expect(leafKeys(getDict(l))).toEqual(jaKeys);
  });

  it.each([...LOCALES])("%s: getDict の葉がすべて string", (l) => {
    expect(nonStringLeaves(getDict(l))).toEqual([]);
  });

  it.each([...LOCALES])("%s: getClientMessages のキー集合が ja と同一", (l) => {
    expect(leafKeys(getClientMessages(l))).toEqual(leafKeys(getClientMessages("ja")));
  });

  it.each([...LOCALES])("%s: getClientMessages の葉がすべて string", (l) => {
    expect(nonStringLeaves(getClientMessages(l))).toEqual([]);
  });

  it.each([...LOCALES])("%s: 空文字の葉のキー集合が ja と同じ", (l) => {
    const emptyKeys = (dict: unknown) =>
      flattenDict(dict)
        .filter((leaf) => leaf.value === "")
        .map((leaf) => leaf.key)
        .sort();
    expect(emptyKeys(getDict(l))).toEqual(emptyKeys(getDict("ja")));
  });

  it("キー比較は欠けと余りを検出できる（比較手段の自己検査）", () => {
    const base = { a: { b: "x" }, c: "y" };
    expect(leafKeys({ a: { b: "x" } })).not.toEqual(leafKeys(base));
    expect(leafKeys({ ...base, d: "z" })).not.toEqual(leafKeys(base));
    expect(nonStringLeaves({ a: 1, b: ["x", null] })).toEqual(["a", "b.1"]);
  });
});
