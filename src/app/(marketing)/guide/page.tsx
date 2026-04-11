import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/marketing/ComingSoonPage";
import { buildMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";

export const metadata: Metadata = buildMetadata(PAGE_METADATA.guide);

export default function GuideIndexPage() {
  return (
    <ComingSoonPage
      title="使い方ガイド"
      description="QRコードとUTMパラメータの使い方を初心者にもわかりやすく解説するガイドを準備中です。"
    />
  );
}
