import { getUseCase, getUseCaseSlugList } from "./getUseCase";
import type { UseCaseMeta } from "@/types/content";

export function getAllUseCases(): UseCaseMeta[] {
  const slugs = getUseCaseSlugList();
  const useCases = slugs
    .map((slug) => {
      const useCase = getUseCase(slug);
      if (!useCase) return null;
      const { content: _content, ...meta } = useCase;
      void _content;
      return meta as UseCaseMeta;
    })
    .filter((u): u is UseCaseMeta => u !== null);

  // orderでソート（未指定は最後）
  return useCases.sort((a, b) => {
    const orderA = a.order ?? Infinity;
    const orderB = b.order ?? Infinity;
    return orderA - orderB;
  });
}
