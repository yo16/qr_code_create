import type { Metadata } from "next";
import { ja } from "@/i18n/ja";
import type { Locale } from "@/i18n/locales";

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp"
);

const ROOT_TEXT: Record<Locale, { title: string; description: string }> = {
  ja: {
    title: ja.meta.root.title,
    description: ja.meta.root.description,
  },
  en: {
    title: "QR Code Create - Free QR code generator with UTM parameters",
    description:
      "Create QR codes for free with built-in UTM parameter guidance. Add decorative frames and embed your logo. No sign-up required.",
  },
};

export function buildRootMetadata(locale: Locale): Metadata {
  const text = ROOT_TEXT[locale];
  return {
    title: {
      default: text.title,
      template: "%s | QR Code Create",
    },
    description: text.description,
    metadataBase,
  };
}

export const rootMetadataJa: Metadata = buildRootMetadata("ja");

export const rootMetadataEn: Metadata = buildRootMetadata("en");
