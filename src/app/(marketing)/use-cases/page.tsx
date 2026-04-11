import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/marketing/ComingSoonPage";
import { buildMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";

export const metadata: Metadata = buildMetadata(PAGE_METADATA.useCases);

export default function UseCasesIndexPage() {
  return (
    <ComingSoonPage
      title="用途別QRコード"
      description="名刺・チラシ・ポスター・イベントなど、用途別にQRコードの活用方法を紹介するページを準備中です。"
    />
  );
}
