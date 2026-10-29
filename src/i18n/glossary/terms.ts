/**
 * 用語集の型と、訳語を検査する辞書キー（doc/design/i18n-multi.md 10 節）。
 * テストと翻訳作業の参照用。Client からは import しない（ESLint の no-restricted-imports で禁止）。
 * 言語ごとの用語集は glossary/{locale}.ts（esGlossary など。M6〜M8）に置く。
 */

export const TERM_IDS = [
  "qrCode",
  "utmParameters",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "download",
  "png",
  "svg",
  "pdf",
  "url",
  "preset",
  "noSignUp",
  "browser",
  "frame",
  "logo",
  "caption",
  "contrast",
  "googleAnalytics",
] as const;
export type TermId = (typeof TERM_IDS)[number];

export interface GlossaryEntry {
  /** 採用する訳語 */
  term: string;
  /** 使わない訳語（ゆれ、別地域の語） */
  forbidden: readonly string[];
}
export type Glossary = Record<TermId, GlossaryEntry>;

/** 用語ごとの ja / en の参照値 */
export const TERM_REFERENCE: Record<TermId, { ja: string; en: string }> = {
  qrCode: { ja: "QRコード", en: "QR code" },
  utmParameters: { ja: "UTMパラメータ", en: "UTM parameters" },
  utmSource: { ja: "utm_source", en: "utm_source" },
  utmMedium: { ja: "utm_medium", en: "utm_medium" },
  utmCampaign: { ja: "utm_campaign", en: "utm_campaign" },
  download: { ja: "ダウンロード", en: "download" },
  png: { ja: "PNG", en: "PNG" },
  svg: { ja: "SVG", en: "SVG" },
  pdf: { ja: "PDF", en: "PDF" },
  url: { ja: "URL", en: "URL" },
  preset: { ja: "プリセット", en: "preset" },
  noSignUp: { ja: "登録不要", en: "no sign-up" },
  browser: { ja: "ブラウザ", en: "browser" },
  frame: { ja: "フレーム", en: "frame" },
  logo: { ja: "ロゴ", en: "logo" },
  caption: { ja: "キャプション", en: "caption" },
  contrast: { ja: "コントラスト", en: "contrast" },
  googleAnalytics: { ja: "Google アナリティクス", en: "Google Analytics" },
};

/**
 * 訳語が必ず入る辞書キー（ドット区切りのパス）。そのキーの値に、その言語の term が入ること。
 * 用語を足すときは、辞書の値にその語が自然に入るキーだけを選ぶ。
 */
export const TERM_ANCHORS: Partial<Record<TermId, readonly string[]>> = {
  qrCode: ["header.cta", "tool.pageHeading", "common.articleCta.defaultText"],
  utmParameters: ["utm.title", "utm.toggleLabel"],
  download: ["tool.download.pngButton", "tool.download.svgButton", "tool.download.pdfButton"],
  noSignUp: ["common.articleCta.note"],
  preset: ["decoration.presetGroupLabel"],
  logo: ["decoration.logo.upload", "decoration.logo.remove"],
  caption: ["decoration.caption.textLabel"],
};

/** ガイド MDX に 1 回以上現れる用語 */
export const GUIDE_REQUIRED_TERMS = ["qrCode", "utmParameters", "download"] as const satisfies readonly TermId[];
