import type { Metadata } from "next";
import { ja } from "@/i18n/ja";
import { getDict } from "@/i18n/getDict";
import type { Locale } from "@/i18n/types";
import { hasEnVersion } from "@/lib/i18n/routes";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";
const SITE_NAME = "QR Code Create";

interface BuildMetadataOptions {
  title: string;
  description: string;
  path: string;       // 例: "/", "/faq", "/guide/utm-parameters"
  ogImagePath?: string; // public/images/og/ 配下のパス
  noIndex?: boolean;
  alternatePaths?: { ja: string; en: string }; // 両言語が揃うページだけ指定
}

/** 3 ページ（home / create / getting-started）の ja/en 対応パス */
export const ALTERNATE_PATHS = {
  home: { ja: "/", en: "/en" },
  create: { ja: "/create", en: "/en/create" },
} as const;

/** ガイド記事の alternatePaths。英語版がある slug だけ返す */
export function getGuideAlternatePaths(slug: string): { ja: string; en: string } | undefined {
  return hasEnVersion(`/guide/${slug}`)
    ? { ja: `/guide/${slug}`, en: `/en/guide/${slug}` }
    : undefined;
}

const OG_LOCALES: Record<Locale, string> = { ja: "ja_JP", en: "en_US" };

export function buildMetadata(
  options: BuildMetadataOptions,
  locale: Locale = "ja"
): Metadata {
  const { title, description, path, ogImagePath = "/images/og/default.png", noIndex = false, alternatePaths } = options;
  const url = `${SITE_URL}${path}`;
  const imageUrl = `${SITE_URL}${ogImagePath}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      ...(alternatePaths
        ? {
            languages: {
              ja: `${SITE_URL}${alternatePaths.ja}`,
              en: `${SITE_URL}${alternatePaths.en}`,
              "x-default": `${SITE_URL}${alternatePaths.ja}`,
            },
          }
        : {}),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      locale: OG_LOCALES[locale],
      ...(alternatePaths ? { alternateLocale: [OG_LOCALES[locale === "ja" ? "en" : "ja"]] } : {}),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}

// プリセットメタデータ（title / description は ja 辞書から。形と export 名は不変）
const pages = ja.meta.pages;

export const PAGE_METADATA = {
  home: { ...pages.home, path: "/", alternatePaths: ALTERNATE_PATHS.home },
  create: { ...pages.create, path: "/create", alternatePaths: ALTERNATE_PATHS.create },
  faq: { ...pages.faq, path: "/faq" },
  privacy: { ...pages.privacy, path: "/privacy", noIndex: true },
  terms: { ...pages.terms, path: "/terms", noIndex: true },
  guide: { ...pages.guide, path: "/guide" },
  useCases: { ...pages.useCases, path: "/use-cases" },
  blog: { ...pages.blog, path: "/blog" },
} as const;

// 英語版（home と create だけ）。使うときは buildMetadata(PAGE_METADATA_EN.home, "en")
const pagesEn = getDict("en").meta.pages;

export const PAGE_METADATA_EN = {
  home: { ...pagesEn.home, path: "/en", alternatePaths: ALTERNATE_PATHS.home },
  create: { ...pagesEn.create, path: "/en/create", alternatePaths: ALTERNATE_PATHS.create },
} as const;
