import { HeroSection } from "@/components/top/HeroSection";
import { FeaturesSection } from "@/components/top/FeaturesSection";
import { CtaSection } from "@/components/top/CtaSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildWebApplicationSchema } from "@/lib/schema/buildJsonLd";
import type { Locale } from "@/i18n/types";

interface HomePageViewProps {
  locale: Locale;
}

export function HomePageView({ locale }: HomePageViewProps) {
  const schema = buildWebApplicationSchema(locale);
  return (
    <>
      <JsonLd data={schema} />
      <HeroSection locale={locale} />
      <FeaturesSection locale={locale} />
      <CtaSection locale={locale} />
    </>
  );
}
