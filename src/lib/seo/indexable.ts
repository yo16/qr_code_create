import { PAGE_METADATA } from "@/lib/metadata/buildMetadata";

// noindex のページ（PAGE_METADATA の noIndex）。sitemap と llms.txt に載せない
export const NOINDEX_PATHS: ReadonlySet<string> = new Set(
  Object.values(PAGE_METADATA)
    .filter((page) => "noIndex" in page && page.noIndex === true)
    .map((page) => page.path),
);

/** ja 側のパス（"" は "/" とみなす。ja トップの URL は末尾スラッシュなし）が索引に載せてよいか */
export function isIndexedPath(path: string): boolean {
  return !NOINDEX_PATHS.has(path || "/");
}
