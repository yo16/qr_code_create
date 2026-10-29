import type { Metadata } from "next";
import { ja } from "@/i18n/ja";
import { getDict } from "@/i18n/getDict";
import type { Locale } from "@/i18n/types";
import { LOCALES, type NonJaLocale } from "@/i18n/locales";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";
import { hasVersion, localePath } from "@/lib/i18n/routes";
import { alternatesFor } from "@/lib/seo/alternates";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";
const SITE_NAME = "QR Code Create";

interface BuildMetadataOptions {
  title: string;
  description: string;
  path: string;       // 例: "/", "/faq", "/guide/utm-parameters"
  ogImagePath?: string; // public/images/og/ 配下のパス
  noIndex?: boolean;
  jaPath?: string;    // 翻訳のあるページだけ指定（ja 側のパス）。hreflang と alternateLocale を作る
}

export function buildMetadata(
  options: BuildMetadataOptions,
  locale: Locale = "ja"
): Metadata {
  const { title, description, path, ogImagePath = "/images/og/default.png", noIndex = false, jaPath } = options;
  const alternates = jaPath ? alternatesFor(jaPath) : undefined;
  const alternateLocales =
    jaPath && alternates
      ? LOCALES.filter((l) => l !== locale && hasVersion(l, jaPath)).map((l) => LOCALE_CONFIG[l].ogLocale)
      : [];
  const url = `${SITE_URL}${path}`;
  const imageUrl = `${SITE_URL}${ogImagePath}`;
  // title はテンプレート（layout の title.template）でサイト名が 1 回付く。
  // og / twitter にはテンプレートが効かないので、サイト名を含まない title にだけここで 1 回付ける (bd-qr_code_create-176 で追加)
  const socialTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      ...(alternates ? { languages: alternates.languages } : {}),
    },
    openGraph: {
      title: socialTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      locale: LOCALE_CONFIG[locale].ogLocale,
      ...(alternates ? { alternateLocale: alternateLocales } : {}),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [imageUrl],
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}

// プリセットメタデータ（title / description は ja 辞書から。形と export 名は不変）
const pages = ja.meta.pages;

export const PAGE_METADATA = {
  home: { ...pages.home, path: "/", jaPath: "/" },
  create: { ...pages.create, path: "/create", jaPath: "/create" },
  faq: { ...pages.faq, path: "/faq" },
  privacy: { ...pages.privacy, path: "/privacy", noIndex: true },
  terms: { ...pages.terms, path: "/terms", noIndex: true },
  guide: { ...pages.guide, path: "/guide" },
  useCases: { ...pages.useCases, path: "/use-cases" },
  blog: { ...pages.blog, path: "/blog" },
} as const;

interface LocalePageMetadataSet {
  home: BuildMetadataOptions;
  create: BuildMetadataOptions;
}

/** ja 以外の言語の home / create のメタデータ。使うときは buildMetadata(getLocalePageMetadata(locale).home, locale) */
export function getLocalePageMetadata(locale: NonJaLocale): LocalePageMetadataSet {
  const pagesLocale = getDict(locale).meta.pages;
  return {
    home: { ...pagesLocale.home, path: localePath(locale, "/"), jaPath: "/" },
    create: { ...pagesLocale.create, path: localePath(locale, "/create"), jaPath: "/create" },
  };
}

// 既存テスト用に残す
export const PAGE_METADATA_EN = getLocalePageMetadata("en");
