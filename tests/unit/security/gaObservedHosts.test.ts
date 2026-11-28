/**
 * csp-ga の E2E で観測した GA の送信先が、CSP の許可に含まれ続けることを、通常の npm test で確かめる（qr_code_create-28o）。
 * fixture（tests/fixtures/ga-observed-hosts.json）は手で更新する。
 */
import fixture from "../../fixtures/ga-observed-hosts.json";
import { getCspDirectives } from "../../../src/lib/security/csp";

function sourcesOf(name: string): string[] {
  const found = getCspDirectives(false).find(([n]) => n === name);
  if (!found) throw new Error(`${name} が CSP に無い`);
  return [...found[1]];
}

/** https://host と https://*.host（先頭のワイルドカードは 1 つ以上のラベルに合う）を扱う */
function matches(source: string, host: string): boolean {
  const m = /^https:\/\/(\*\.)?([^/:]+)$/.exec(source);
  if (!m) return false;
  const [, wildcard, base] = m;
  return wildcard ? host.endsWith(`.${base}`) : host === base;
}

describe("GA の観測済みの送信先と CSP", () => {
  it("fixture に観測日と 1 件以上の送信先がある", () => {
    expect(fixture.observedAt).toBe("2026-11-28");
    expect(fixture.entries.length).toBeGreaterThan(0);
  });

  for (const entry of fixture.entries) {
    it(`${entry.method} ${entry.host}${entry.path}（${entry.resourceType}）が ${entry.directive} に許可されている`, () => {
      const allowed = sourcesOf(entry.directive);
      // 失敗時に許可の一覧が見えるよう、一覧と一緒に比べる
      const hit = allowed.filter((s) => matches(s, entry.host));
      expect({ host: entry.host, directive: entry.directive, allowed, hit: hit.length > 0 }).toEqual({
        host: entry.host,
        directive: entry.directive,
        allowed,
        hit: true,
      });
    });
  }

  it("matches は許可外のホストを通さない", () => {
    expect(sourcesOf("connect-src").some((s) => matches(s, "evil.example"))).toBe(false);
    expect(matches("https://*.google-analytics.com", "google-analytics.com")).toBe(false);
  });
});
