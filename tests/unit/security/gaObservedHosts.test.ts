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

/** YYYY-MM-DD の形式で、実在する日付なら true（2026-02-30 などは false） */
function isValidIsoDate(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

describe("isValidIsoDate", () => {
  it("実在する YYYY-MM-DD を通す", () => {
    expect(isValidIsoDate("2026-11-28")).toBe(true);
    expect(isValidIsoDate("2024-02-29")).toBe(true);
  });

  it("形式違い、実在しない日付、空文字を通さない", () => {
    expect(isValidIsoDate("2026/11/28")).toBe(false);
    expect(isValidIsoDate("2026-1-5")).toBe(false);
    expect(isValidIsoDate("2026-11-28T00:00:00Z")).toBe(false);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2025-02-29")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("")).toBe(false);
    expect(isValidIsoDate("2026-04-31")).toBe(false);
    expect(isValidIsoDate("2026-00-10")).toBe(false);
    expect(isValidIsoDate("2026-01-00")).toBe(false);
    expect(isValidIsoDate("2100-02-29")).toBe(false); // 100 年で割れるが 400 年で割れないので平年
  });

  it("閏年の規則（400 年で割れる年は閏年）を通す", () => {
    expect(isValidIsoDate("2000-02-29")).toBe(true);
  });

  it("前後の空白や改行を通さない", () => {
    expect(isValidIsoDate(" 2026-11-28")).toBe(false);
    expect(isValidIsoDate("2026-11-28 ")).toBe(false);
    expect(isValidIsoDate("2026-11-28\n")).toBe(false);
  });

  it("文字列でない値を通さない", () => {
    expect(isValidIsoDate(null)).toBe(false);
    expect(isValidIsoDate(undefined)).toBe(false);
    expect(isValidIsoDate(20261128)).toBe(false);
    expect(isValidIsoDate(new Date(Date.UTC(2026, 10, 28)))).toBe(false);
  });
});

describe("GA の観測済みの送信先と CSP", () => {
  it("fixture に観測日と 1 件以上の送信先がある", () => {
    expect({ observedAt: fixture.observedAt, valid: isValidIsoDate(fixture.observedAt) }).toEqual({
      observedAt: fixture.observedAt,
      valid: true,
    });
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
