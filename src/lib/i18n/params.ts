import { notFound } from "next/navigation";
import { isNonJaLocale, type NonJaLocale } from "@/i18n/locales";

export interface LocaleParams {
  locale: string;
}

/** [locale] セグメントを検証する。ja 以外の対応言語でなければ notFound()（/ja もここで外れる） */
export async function resolveLocale(params: Promise<LocaleParams>): Promise<NonJaLocale> {
  const { locale } = await params;
  if (!isNonJaLocale(locale)) notFound();
  return locale;
}
