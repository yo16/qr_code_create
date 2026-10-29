/**
 * frontmatter の日付を YYYY-MM-DD の文字列にする。
 * gray-matter は引用符なしの日付（2026-10-28）を Date に変えるので、引用符の有無にかかわらず文字列にそろえる。
 * Date は UTC の 0 時になるため、UTC の年月日で取り出す。
 */
export function toIsoDate(value: unknown): string | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value !== "") return value;
  return undefined;
}

/** 必須の日付（frontmatter の date）。無いか不正なら、記事の書き漏れとしてビルドを止める */
export function requireIsoDate(value: unknown, source: string): string {
  const date = toIsoDate(value);
  if (!date) throw new Error(`frontmatter の date が無いか不正です: ${source}`);
  return date;
}
