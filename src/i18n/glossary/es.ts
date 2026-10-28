/**
 * スペイン語の用語集（doc/design/i18n-multi.md 10 節）。呼びかけは tú、地域を限らない中立的なスペイン語。
 * テストと翻訳作業の参照用。Client からは import しない。
 */
import type { Glossary } from "./terms";

export const esGlossary: Glossary = {
  qrCode: { term: "código QR", forbidden: ["QR-Code", "codigo QR", "código de QR"] },
  utmParameters: { term: "parámetros UTM", forbidden: ["parametros UTM"] },
  utmSource: { term: "utm_source", forbidden: [] },
  utmMedium: { term: "utm_medium", forbidden: [] },
  utmCampaign: { term: "utm_campaign", forbidden: [] },
  download: { term: "descargar", forbidden: ["bajar"] },
  png: { term: "PNG", forbidden: [] },
  svg: { term: "SVG", forbidden: [] },
  pdf: { term: "PDF", forbidden: [] },
  url: { term: "URL", forbidden: ["enlace web"] },
  preset: { term: "diseños predefinidos", forbidden: ["preset", "presets", "preestablecido", "preestablecidos"] },
  noSignUp: { term: "sin registro", forbidden: ["sin inscripción", "sin sign-up"] },
  browser: { term: "navegador", forbidden: ["explorador", "browser"] },
  frame: { term: "marco", forbidden: ["cuadro", "frame"] },
  logo: { term: "logotipo", forbidden: ["logo"] },
  caption: { term: "leyenda", forbidden: ["caption", "subtítulo"] },
  contrast: { term: "contraste", forbidden: ["contrast"] },
  googleAnalytics: { term: "Google Analytics", forbidden: ["Google Analitics"] },
};

/** 呼びかけの禁止（tú にそろえる）。usted / ustedes / vos / vosotros 系 */
export const addressForbidden: readonly RegExp[] = [
  /(?<![\p{L}\p{N}])(usted|ustedes|vos|vosotros|vosotras|vuestro|vuestra|vuestros|vuestras)(?![\p{L}\p{N}])/iu,
];
