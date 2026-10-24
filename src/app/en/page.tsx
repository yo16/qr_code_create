import type { Metadata } from "next";
import { HomePageView } from "@/components/pages/HomePageView/HomePageView";
import { buildMetadata, PAGE_METADATA_EN } from "@/lib/metadata/buildMetadata";

export const metadata: Metadata = buildMetadata(PAGE_METADATA_EN.home, "en");

export default function EnHomePage() {
  return <HomePageView locale="en" />;
}
