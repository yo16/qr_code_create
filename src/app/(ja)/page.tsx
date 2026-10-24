import type { Metadata } from "next";
import { HeroSection } from "@/components/top/HeroSection";
import { FeaturesSection } from "@/components/top/FeaturesSection";
import { CtaSection } from "@/components/top/CtaSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildWebApplicationSchema } from "@/lib/schema/buildJsonLd";
import { buildMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";

export const metadata: Metadata = buildMetadata(PAGE_METADATA.home);

export default function Home() {
  const schema = buildWebApplicationSchema();
  return (
    <>
      <JsonLd data={schema} />
      <HeroSection />
      <FeaturesSection />
      <CtaSection />
    </>
  );
}
