import { ja } from "@/i18n/ja";
import type { Dict } from "@/i18n/types";

type UtmDict = Dict["utm"];

export interface UtmOption {
  value: string;
  label: string;
}

/** 値は言語によらず同じ（F-012）。表示名は辞書の utm.sourceLabels[value] */
export const UTM_SOURCE_VALUES = [
  "flyer",
  "poster",
  "business_card",
  "brochure",
  "banner",
  "receipt",
  "product_package",
  "menu",
  "signage",
] as const;

export const UTM_MEDIUM_VALUES = ["qr", "print"] as const;

/** 用途別設定例の値（label は辞書の utm.usageExampleLabels[source]） */
export const UTM_USAGE_EXAMPLE_VALUES = [
  { source: "business_card", medium: "qr", campaign: "networking_2026" },
  { source: "flyer", medium: "qr", campaign: "sale_2026" },
  { source: "poster", medium: "qr", campaign: "event_2026" },
  { source: "signage", medium: "qr", campaign: "store_promo_2026" },
] as const;

export function buildUtmSourceOptions(utm: UtmDict): UtmOption[] {
  return UTM_SOURCE_VALUES.map((value) => ({
    value,
    label: utm.sourceLabels[value],
  }));
}

export function buildUtmMediumOptions(utm: UtmDict): UtmOption[] {
  return UTM_MEDIUM_VALUES.map((value) => ({
    value,
    label: utm.mediumLabels[value],
  }));
}

export function buildUtmFieldHelp(utm: UtmDict): UtmDict["fieldHelp"] {
  return { ...utm.fieldHelp };
}

export function buildUtmUsageExamples(utm: UtmDict) {
  return UTM_USAGE_EXAMPLE_VALUES.map((example) => ({
    label: utm.usageExampleLabels[example.source],
    source: example.source,
    medium: example.medium,
    campaign: example.campaign,
  }));
}

// 既存 export（名前と形は変えない）。ja 辞書から組み立てる
export const UTM_SOURCE_OPTIONS = buildUtmSourceOptions(ja.utm);

export const UTM_MEDIUM_OPTIONS = buildUtmMediumOptions(ja.utm);

export const UTM_FIELD_HELP = buildUtmFieldHelp(ja.utm);

// 用途別設定例
export const UTM_USAGE_EXAMPLES = buildUtmUsageExamples(ja.utm);
