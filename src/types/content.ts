export interface GuideFrontmatter {
  title: string;
  description: string;
  date: string; // ISO date "YYYY-MM-DD"
  order?: number;
}

export interface GuideMeta extends GuideFrontmatter {
  slug: string;
}

export interface GuideContent extends GuideMeta {
  content: string; // MDX raw content
}

export interface UseCaseFrontmatter {
  title: string;
  description: string;
  date: string; // ISO date "YYYY-MM-DD"
  order?: number;
  utmSource?: string; // 推奨utm_source値
  preset?: string; // おすすめ装飾プリセットID
}

export interface UseCaseMeta extends UseCaseFrontmatter {
  slug: string;
}

export interface UseCaseContent extends UseCaseMeta {
  content: string; // MDX raw content
}
