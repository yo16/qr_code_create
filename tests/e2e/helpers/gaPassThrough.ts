/**
 * csp-ga の E2E で、本物を読みに行く（素通しにする）要求の判定。
 * @playwright/test を import しない（Jest の単体テストから読むため）。
 */
export const GTM_HOST = "www.googletagmanager.com";

/**
 * 素通しにする要求か。GET で、https で、ホスト（ポートを含む）が www.googletagmanager.com と完全一致し、
 * パスが /gtag/ で始まるときだけ true。URL が壊れていれば new URL が例外を投げる。
 */
export function isPassThrough(method: string, rawUrl: string): boolean {
  const u = new URL(rawUrl);
  // u.host はポートを含む（https の 443 は URL が省略する）ので、8443 などは通らない
  return method === "GET" && u.protocol === "https:" && u.host === GTM_HOST && u.pathname.startsWith("/gtag/");
}
