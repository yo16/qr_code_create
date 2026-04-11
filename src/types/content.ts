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
