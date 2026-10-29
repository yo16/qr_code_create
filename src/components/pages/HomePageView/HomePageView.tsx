import { HeroSection } from "@/components/top/HeroSection";
import { FeaturesSection } from "@/components/top/FeaturesSection";
import { CtaSection } from "@/components/top/CtaSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/schema/buildJsonLd";
import type { Locale } from "@/i18n/types";

interface HomePageViewProps {
  locale: Locale;
}

export function HomePageView({ locale }: HomePageViewProps) {
  return (
    <>
      <JsonLd data={buildWebSiteSchema(locale)} />
      <JsonLd data={buildOrganizationSchema(locale)} />
      <HeroSection locale={locale} />
      <FeaturesSection locale={locale} />
      <CtaSection locale={locale} />
    </>
  );
}
