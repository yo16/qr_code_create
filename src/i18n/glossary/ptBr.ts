/**
 * ブラジルポルトガル語の用語集（doc/design/i18n-multi.md 10 節）。
 * テストと翻訳作業の参照用。Client からは import しない。
 * term は辞書の実際の語形（単数・複数）と一致させる。照合は語の境界でする。
 */
import type { Glossary } from "./terms";

export const ptBrGlossary: Glossary = {
  qrCode: { term: "QR Code", forbidden: ["QR-Code", "código QR"] },
  utmParameters: { term: "parâmetros UTM", forbidden: ["parametros UTM", "UTM-Parameter"] },
  utmSource: { term: "utm_source", forbidden: [] },
  utmMedium: { term: "utm_medium", forbidden: [] },
  utmCampaign: { term: "utm_campaign", forbidden: [] },
  download: { term: "baixar", forbidden: ["transferir", "descarregar", "fazer o download"] },
  png: { term: "PNG", forbidden: [] },
  svg: { term: "SVG", forbidden: [] },
  pdf: { term: "PDF", forbidden: [] },
  url: { term: "URL", forbidden: [] },
  preset: { term: "predefinição", forbidden: ["preset", "pré-definição", "predefinido"] },
  noSignUp: { term: "sem cadastro", forbidden: ["sem registo", "sem registro", "sem inscrição"] },
  browser: { term: "navegador", forbidden: ["browser"] },
  frame: { term: "moldura", forbidden: ["frame", "quadro"] },
  logo: { term: "logo", forbidden: ["logótipo", "logotipo"] },
  caption: { term: "legenda", forbidden: ["caption"] },
  contrast: { term: "contraste", forbidden: [] },
  googleAnalytics: { term: "Google Analytics", forbidden: ["Google Analítica"] },
};

/** 呼びかけは você にそろえる。tu / teu 系と vós、ポルトガル（欧州）の語彙を避ける */
export const ptBrAddressForbidden: readonly RegExp[] = [
  /(?<![\p{L}\p{N}])(tu|teu|tua|teus|tuas|contigo|vós|vosso|vossa|vossos|vossas)(?![\p{L}\p{N}])/iu,
  /(?<![\p{L}\p{N}])(ficheiro|ficheiros|ecrã|ecrãs|utilizador|utilizadores|telemóvel|equipa|rato)(?![\p{L}\p{N}])/iu,
];
