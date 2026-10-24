/**
 * `{name}` 形式のプレースホルダを埋める（Client 用の補間）。
 * params に無いキーのプレースホルダはそのまま残す。
 */
export function formatMessage(
  template: string,
  params: Record<string, string | number> = {}
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key)
      ? String(params[key])
      : match
  );
}
