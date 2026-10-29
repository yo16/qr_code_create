import { RootShell } from "@/components/layout/RootShell/RootShell";
import { NON_JA_LOCALES } from "@/i18n/locales";
import { resolveLocale, type LocaleParams } from "@/lib/i18n/params";
import { buildRootMetadata } from "@/lib/metadata/rootMetadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return NON_JA_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<LocaleParams> }) {
  return buildRootMetadata(await resolveLocale(params));
}

export default async function LocaleRootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<LocaleParams>;
}>) {
  const locale = await resolveLocale(params);
  return <RootShell locale={locale}>{children}</RootShell>;
}
