import type { Metadata } from "next";
import { ja } from "@/i18n/ja";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";
const SITE_NAME = "QR Code Create";

interface BuildMetadataOptions {
  title: string;
  description: string;
  path: string;       // 例: "/", "/faq", "/guide/utm-parameters"
  ogImagePath?: string; // public/images/og/ 配下のパス
  noIndex?: boolean;
}

export function buildMetadata(options: BuildMetadataOptions): Metadata {
  const { title, description, path, ogImagePath = "/images/og/default.png", noIndex = false } = options;
  const url = `${SITE_URL}${path}`;
  const imageUrl = `${SITE_URL}${ogImagePath}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      locale: "ja_JP",
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
  home: { ...pages.home, path: "/" },
  create: { ...pages.create, path: "/create" },
  faq: { ...pages.faq, path: "/faq" },
  privacy: { ...pages.privacy, path: "/privacy", noIndex: true },
  terms: { ...pages.terms, path: "/terms", noIndex: true },
  guide: { ...pages.guide, path: "/guide" },
  useCases: { ...pages.useCases, path: "/use-cases" },
  blog: { ...pages.blog, path: "/blog" },
} as const;
