import type { Metadata } from "next";
import { HomePageView } from "@/components/pages/HomePageView/HomePageView";
import { resolveLocale, type LocaleParams } from "@/lib/i18n/params";
import { buildMetadata, getLocalePageMetadata } from "@/lib/metadata/buildMetadata";

export const dynamicParams = false;

interface LocaleHomePageProps {
  params: Promise<LocaleParams>;
}

export async function generateMetadata({ params }: LocaleHomePageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return buildMetadata(getLocalePageMetadata(locale).home, locale);
}

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const locale = await resolveLocale(params);
  return <HomePageView locale={locale} />;
}
