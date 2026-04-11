import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/marketing/ComingSoonPage";
import { buildMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";

export const metadata: Metadata = buildMetadata(PAGE_METADATA.blog);

export default function BlogIndexPage() {
  return (
    <ComingSoonPage
      title="ブログ"
      description="QRコードマーケティングに関する記事を掲載するブログを準備中です。"
    />
  );
}
