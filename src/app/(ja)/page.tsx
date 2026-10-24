import type { Metadata } from "next";
import { HomePageView } from "@/components/pages/HomePageView/HomePageView";
import { buildMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";

export const metadata: Metadata = buildMetadata(PAGE_METADATA.home);

export default function Home() {
  return <HomePageView locale="ja" />;
}
