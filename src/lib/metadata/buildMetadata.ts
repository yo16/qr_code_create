import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-code-create.vercel.app";
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

// プリセットメタデータ
export const PAGE_METADATA = {
  home: {
    title: "QR Code Create - UTMパラメータ付きQRコード生成ツール",
    description: "UTMパラメータのガイダンス付きでQRコードを無料生成。装飾フレームやロゴ埋め込みでマーケティング効果を最大化。登録不要。",
    path: "/",
  },
  create: {
    title: "QRコード生成 - QR Code Create",
    description: "URLを入力するだけ。UTMパラメータと装飾フレームでマーケティング効果を最大化するQRコードを無料で作成できます。",
    path: "/create",
  },
  faq: {
    title: "よくある質問",
    description: "QR Code Createの使い方やUTMパラメータの設定方法など、よくある質問にお答えします。",
    path: "/faq",
  },
  privacy: {
    title: "プライバシーポリシー",
    description: "QR Code Createのプライバシーポリシーです。",
    path: "/privacy",
    noIndex: true,
  },
  terms: {
    title: "利用規約",
    description: "QR Code Createの利用規約です。",
    path: "/terms",
    noIndex: true,
  },
  guide: {
    title: "使い方ガイド",
    description: "QR Code Createの使い方とUTMパラメータの基礎知識を学べる総合ガイド。",
    path: "/guide",
  },
} as const;
