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

export interface BlogFrontmatter {
  title: string;
  description: string;
  date: string; // ISO date "YYYY-MM-DD"
  category?: string; // qr-marketing, utm-tips, story 等
}

export interface BlogMeta extends BlogFrontmatter {
  slug: string;
}

export interface BlogContent extends BlogMeta {
  content: string; // MDX raw content
}
