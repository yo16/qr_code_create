import type { Metadata } from "next";
import { ja } from "@/i18n/ja";

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp"
);

export const rootMetadataJa: Metadata = {
  title: {
    default: ja.meta.root.title,
    template: "%s | QR Code Create",
  },
  description: ja.meta.root.description,
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
