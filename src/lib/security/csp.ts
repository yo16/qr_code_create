/**
 * Content-Security-Policy の組み立て。
 * ディレクティブごとの配列から文字列を作る。next.config.ts から使い、単体テストでも中身を検査できる。
 * 静的生成のため nonce は使わず、'unsafe-inline' で GA のインラインスクリプトと Next.js の埋め込みスクリプトを許す。
 */

type CspDirectives = ReadonlyArray<readonly [name: string, values: readonly string[]]>;

const GA_CONNECT = [
  "https://www.google-analytics.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
  "https://*.googletagmanager.com",
  "https://stats.g.doubleclick.net",
];

const GA_IMG = [
  "https://www.google-analytics.com",
  "https://*.google-analytics.com",
  "https://www.googletagmanager.com",
  "https://*.g.doubleclick.net",
];

export function getCspDirectives(isDev: boolean): CspDirectives {
  // 開発サーバーは eval を使うので dev のときだけ許す
  const scriptSrc = ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"];
  if (isDev) scriptSrc.push("'unsafe-eval'");

  return [
    ["default-src", ["'self'"]],
    ["script-src", scriptSrc],
    ["connect-src", ["'self'", ...GA_CONNECT]],
    ["img-src", ["'self'", "data:", "blob:", ...GA_IMG]],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["font-src", ["'self'", "data:"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    // 問い合わせフォーム（/contact）は外部のフォームサービスへ送信する
    ["form-action", ["'self'", "https://ssl.form-mailer.jp"]],
    ["frame-ancestors", ["'none'"]],
    ["upgrade-insecure-requests", []],
  ];
}

export function buildCsp(isDev: boolean): string {
  return getCspDirectives(isDev)
    .map(([name, values]) => (values.length > 0 ? `${name} ${values.join(" ")}` : name))
    .join("; ");
}
