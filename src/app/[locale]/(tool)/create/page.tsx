import type { Metadata } from "next";
import { CreatePageView } from "@/components/pages/CreatePageView/CreatePageView";
import { resolveLocale, type LocaleParams } from "@/lib/i18n/params";
import { buildMetadata, getLocalePageMetadata } from "@/lib/metadata/buildMetadata";

export const dynamicParams = false;

interface LocaleCreatePageProps {
  params: Promise<LocaleParams>;
}

export async function generateMetadata({ params }: LocaleCreatePageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return buildMetadata(getLocalePageMetadata(locale).create, locale);
}

export default async function LocaleCreatePage({ params }: LocaleCreatePageProps) {
  const locale = await resolveLocale(params);
  return <CreatePageView locale={locale} />;
}
