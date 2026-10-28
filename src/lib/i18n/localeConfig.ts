import type { Locale } from "@/i18n/locales";

export interface LocaleConfig {
  prefix: "" | `/${string}`; // URL 接頭辞。ja は ""
  htmlLang: string; // <html lang>、a の lang / hrefLang
  hreflang: string; // alternates.languages のキー
  ogLocale: string; // openGraph.locale
  currency: "JPY" | "USD" | "EUR" | "BRL"; // JSON-LD Offer.priceCurrency
  nativeName: string; // 切り替え一覧の表示名（自称）
  shortName: string; // 切り替えボタンの表示名（ヘッダーに収まる長さ）
  paths: "all" | readonly string[]; // その言語がある ja 側のパス
  poster: boolean; // /poster への導線を出すか
}

/** ja 以外の言語が持つページ（ja 側のパス）。ページを足したらここにも足す */
export const TRANSLATED_PATHS = ["/", "/create", "/guide/getting-started"] as const;

export const LOCALE_CONFIG = {
  ja: {
    prefix: "",
    htmlLang: "ja",
    hreflang: "ja",
    ogLocale: "ja_JP",
    currency: "JPY",
    nativeName: "日本語",
    shortName: "日本語",
    paths: "all",
    poster: true,
  },
  en: {
    prefix: "/en",
    htmlLang: "en",
    hreflang: "en",
    ogLocale: "en_US",
    currency: "USD",
    nativeName: "English",
    shortName: "English",
    paths: TRANSLATED_PATHS,
    poster: false,
  },
} as const satisfies Record<Locale, LocaleConfig>;
