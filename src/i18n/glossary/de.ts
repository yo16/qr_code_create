/**
 * ドイツ語の用語集（doc/design/i18n-multi.md 10 節）。テストと翻訳作業の参照用。Client からは import しない。
 * 禁止語の照合は大文字小文字を区別して行う（checkGlossary の caseSensitiveForbidden: true）。
 * 「QR Code Create」はサイト名なので、禁止語に「QR Code」は入れない。
 */
import type { Glossary } from "./terms";

export const deGlossary: Glossary = {
  qrCode: { term: "QR-Code", forbidden: ["QR-code", "QRCode", "QR Codes"] },
  utmParameters: { term: "UTM-Parameter", forbidden: ["UTM-Parameters", "UTM Parameter"] },
  utmSource: { term: "utm_source", forbidden: [] },
  utmMedium: { term: "utm_medium", forbidden: [] },
  utmCampaign: { term: "utm_campaign", forbidden: [] },
  download: { term: "herunterladen", forbidden: ["downloaden", "Downloaden", "runterladen"] },
  png: { term: "PNG", forbidden: [] },
  svg: { term: "SVG", forbidden: [] },
  pdf: { term: "PDF", forbidden: [] },
  url: { term: "URL", forbidden: [] },
  preset: { term: "Vorlagen", forbidden: ["Presets", "Voreinstellungen"] },
  noSignUp: { term: "ohne Anmeldung", forbidden: ["ohne Registrierung", "ohne Sign-up"] },
  browser: { term: "Browser", forbidden: [] },
  frame: { term: "Rahmen", forbidden: ["Frame", "Frames"] },
  logo: { term: "Logo", forbidden: [] },
  caption: { term: "Beschriftung", forbidden: ["Caption", "Bildunterschrift"] },
  contrast: { term: "Kontrast", forbidden: ["Contrast"] },
  googleAnalytics: { term: "Google Analytics", forbidden: ["Google-Analytics"] },
};

/** 呼びかけの禁止語（Sie にそろえる）。大文字小文字を区別する */
export const deAddressForbidden: readonly RegExp[] = [
  /(?<![\p{L}\p{N}])(?:[Dd]u|[Dd]ein\p{L}*|[Dd]ich|[Dd]ir|[Ee]uch|[Ee]uer\p{L}*|[Ee]ure[mnrs]?)(?![\p{L}\p{N}])/u,
];

/** checkGlossary に渡す。de の Sie / sie を区別するため caseSensitiveForbidden を立てる */
export const deGlossaryOptions = {
  addressForbidden: deAddressForbidden,
  caseSensitiveForbidden: true,
} as const;
