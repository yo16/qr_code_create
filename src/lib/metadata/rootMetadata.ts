import type { Metadata } from "next";
import { getDict } from "@/i18n/getDict";
import type { Locale } from "@/i18n/locales";

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp"
);

// 設計書 6.2: 全言語の辞書は getDict から引く（es / pt-br / de の下書きは en の写し）
function rootText(locale: Locale): { title: string; description: string } {
  const { title, description } = getDict(locale).meta.root;
  return { title, description };
}

export function buildRootMetadata(locale: Locale): Metadata {
  const text = rootText(locale);
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
