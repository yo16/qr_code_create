import type { Metadata } from "next";

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp"
);

export const rootMetadataJa: Metadata = {
  title: {
    default: "QR Code Create - UTMパラメータ付きQRコード生成ツール",
    template: "%s | QR Code Create",
  },
  description:
    "UTMパラメータのガイダンス付きでQRコードを無料生成。装飾フレームやロゴ埋め込みでマーケティング効果を最大化。登録不要。",
  metadataBase,
};

export const rootMetadataEn: Metadata = {
  title: {
    default: "QR Code Create - Free QR code generator with UTM parameters",
    template: "%s | QR Code Create",
  },
  description:
    "Create QR codes for free with built-in UTM parameter guidance. Add decorative frames and embed your logo. No sign-up required.",
  metadataBase,
};
