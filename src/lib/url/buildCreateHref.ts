interface BuildCreateHrefParams {
  preset?: string;
  utmSource?: string;
}

/**
 * /create へのリンクを組み立てる。
 * クエリ順序: utm_source -> utm_medium -> preset
 */
export function buildCreateHref(params: BuildCreateHrefParams = {}): string {
  const { preset, utmSource } = params;
  const searchParams = new URLSearchParams();
  if (utmSource) {
    searchParams.set("utm_source", utmSource);
    searchParams.set("utm_medium", "qr");
  }
  if (preset) {
    searchParams.set("preset", preset);
  }
  const query = searchParams.toString();
  return query ? `/create?${query}` : "/create";
}
