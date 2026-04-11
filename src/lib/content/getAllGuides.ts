import { getGuide, getGuideSlugList } from "./getGuide";
import type { GuideMeta } from "@/types/content";

export function getAllGuides(): GuideMeta[] {
  const slugs = getGuideSlugList();
  const guides = slugs
    .map((slug) => {
      const guide = getGuide(slug);
      if (!guide) return null;
      // contentを除外してメタデータのみ返す
      const { content: _content, ...meta } = guide;
      void _content;
      return meta as GuideMeta;
    })
    .filter((g): g is GuideMeta => g !== null);

  // orderでソート（未指定は最後）
  return guides.sort((a, b) => {
    const orderA = a.order ?? Infinity;
    const orderB = b.order ?? Infinity;
    return orderA - orderB;
  });
}
