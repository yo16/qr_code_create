import { buildCsp, getCspDirectives } from "@/lib/security/csp";

/** 文字列の CSP をディレクティブ名 → 値の配列にする */
function parse(csp: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const part of csp.split("; ")) {
    const [name, ...values] = part.split(" ");
    map.set(name, values);
  }
  return map;
}

describe("buildCsp", () => {
  const prod = parse(buildCsp(false));
  const dev = parse(buildCsp(true));

  describe("unsafe-eval", () => {
    it("本番には 'unsafe-eval' が無い", () => {
      expect(buildCsp(false)).not.toContain("'unsafe-eval'");
      expect(prod.get("script-src")).not.toContain("'unsafe-eval'");
    });

    it("dev には script-src に 'unsafe-eval' がある", () => {
      expect(dev.get("script-src")).toContain("'unsafe-eval'");
    });

    it("'unsafe-eval' は dev の script-src 以外には現れない", () => {
      for (const [name, values] of dev) {
        if (name !== "script-src") expect(values).not.toContain("'unsafe-eval'");
      }
    });
  });

  describe.each([
    ["本番", prod],
    ["dev", dev],
  ] as const)("%s のディレクティブの値", (_label, directives) => {
    it("default-src は 'self' だけ", () => {
      expect(directives.get("default-src")).toEqual(["'self'"]);
    });

    it("script-src に 'self' 'unsafe-inline' と Google Tag Manager がある", () => {
      const values = directives.get("script-src") ?? [];
      expect(values).toEqual(expect.arrayContaining(["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"]));
    });

    it("object-src は 'none'", () => {
      expect(directives.get("object-src")).toEqual(["'none'"]);
    });

    it("base-uri は 'self'", () => {
      expect(directives.get("base-uri")).toEqual(["'self'"]);
    });

    it("form-action は 'self' と問い合わせフォームのサービスだけ", () => {
      expect(directives.get("form-action")).toEqual(["'self'", "https://ssl.form-mailer.jp"]);
    });

    it("frame-ancestors は 'none'", () => {
      expect(directives.get("frame-ancestors")).toEqual(["'none'"]);
    });

    it("upgrade-insecure-requests は値なしで入っている", () => {
      expect(directives.has("upgrade-insecure-requests")).toBe(true);
      expect(directives.get("upgrade-insecure-requests")).toEqual([]);
    });

    it("img-src は QR の描画に必要な data: と blob: を許す", () => {
      expect(directives.get("img-src")).toEqual(expect.arrayContaining(["'self'", "data:", "blob:"]));
    });

    it("connect-src に GA の送信先がある", () => {
      expect(directives.get("connect-src")).toEqual(
        expect.arrayContaining(["'self'", "https://www.google-analytics.com"]),
      );
    });
  });

  describe("緩すぎるソースが無い", () => {
    const BANNED = ["*", "http:", "https:", "'unsafe-hashes'"];
    it.each([
      ["本番", false],
      ["dev", true],
    ] as const)("%s のどのディレクティブにも * 単独・http:・https: 単独・'unsafe-hashes' が無い", (_label, isDev) => {
      for (const [name, values] of getCspDirectives(isDev)) {
        for (const banned of BANNED) {
          expect({ name, found: values.includes(banned) ? banned : null }).toEqual({ name, found: null });
        }
      }
    });

    it("default-src に 'unsafe-inline' が無い（script-src と style-src だけ）", () => {
      expect(prod.get("default-src")).not.toContain("'unsafe-inline'");
    });

    it("ワイルドカードはサブドメインの形（https://*.example）だけ", () => {
      for (const [, values] of getCspDirectives(false)) {
        for (const v of values) {
          if (v.includes("*")) expect(v).toMatch(/^https:\/\/\*\.[a-z0-9.-]+$/);
        }
      }
    });
  });

  describe("文字列の形式", () => {
    it.each([
      ["本番", false],
      ["dev", true],
    ] as const)("%s は '; ' 区切りで、先頭末尾に余計な ; や空白が無い", (_label, isDev) => {
      const csp = buildCsp(isDev);
      expect(csp.endsWith(";")).toBe(false);
      expect(csp.startsWith(";")).toBe(false);
      expect(csp).toBe(csp.trim());
      expect(csp).not.toMatch(/;;/);
      expect(csp).not.toMatch(/;\S/);
      expect(csp).not.toMatch(/ {2}/);
      expect(csp.split("; ")).toHaveLength(getCspDirectives(isDev).length);
    });

    it("値のないディレクティブは名前だけで、末尾に空白が付かない", () => {
      expect(buildCsp(false).endsWith("upgrade-insecure-requests")).toBe(true);
    });

    it("同じディレクティブ名が 2 回出ない", () => {
      const names = getCspDirectives(false).map(([name]) => name);
      expect(new Set(names).size).toBe(names.length);
    });

    it("改行を含まない（HTTP ヘッダーに入れられる）", () => {
      expect(buildCsp(false)).not.toMatch(/[\r\n]/);
    });
  });
});
