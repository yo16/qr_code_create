import { getBlog, getBlogSlugList } from "./getBlog";
import type { BlogMeta } from "@/types/content";

export function getAllBlogs(): BlogMeta[] {
  const slugs = getBlogSlugList();
  const blogs = slugs
    .map((slug) => {
      const blog = getBlog(slug);
      if (!blog) return null;
      const { content: _content, ...meta } = blog;
      void _content;
      return meta as BlogMeta;
    })
    .filter((b): b is BlogMeta => b !== null);

  // 日付の新しい順でソート
  return blogs.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}
