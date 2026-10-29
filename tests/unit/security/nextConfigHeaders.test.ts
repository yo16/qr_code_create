/**
 * next.config.ts のセキュリティヘッダー（qr_code_create-j0q）。
 * NODE_ENV で isDev が決まるため、jest.isolateModules で読み直して切り替える。
 */
type HeaderEntry = { source: string; headers: { key: string; value: string }[] };
type LoadedConfig = {
  poweredByHeader?: boolean;
  headers?: () => Promise<HeaderEntry[]>;
};

const env = process.env as Record<string, string | undefined>;
const originalNodeEnv = env.NODE_ENV;

function loadConfig(nodeEnv: string): LoadedConfig {
  env.NODE_ENV = nodeEnv;
  let loaded: LoadedConfig | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("../../../next.config") as { default: LoadedConfig };
    loaded = mod.default;
  });
  if (!loaded) throw new Error("next.config を読み込めませんでした");
  return loaded;
}

async function headersOf(nodeEnv: string): Promise<Map<string, string>> {
  const config = loadConfig(nodeEnv);
  if (!config.headers) throw new Error("headers() が未定義です");
  const entries = await config.headers();
  const rootEntries = entries.filter((e) => e.source === "/(.*)");
  expect(rootEntries).toHaveLength(1);
  return new Map(rootEntries[0].headers.map((h) => [h.key, h.value]));
}

afterEach(() => {
  env.NODE_ENV = originalNodeEnv;
});

describe("next.config", () => {
  it("poweredByHeader が false（X-Powered-By を出さない）", () => {
    expect(loadConfig("production").poweredByHeader).toBe(false);
  });

  it("headers() の source は '/(.*)' だけ", async () => {
    const entries = await (loadConfig("production").headers as () => Promise<HeaderEntry[]>)();
    expect(entries.map((e) => e.source)).toEqual(["/(.*)"]);
  });

  describe("本番のヘッダー", () => {
    it("必要なヘッダーが source '/(.*)' に揃っている", async () => {
      const h = await headersOf("production");
      expect(h.get("X-Content-Type-Options")).toBe("nosniff");
      expect(h.get("X-Frame-Options")).toBe("DENY");
      expect(h.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(h.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
      expect(h.has("Permissions-Policy")).toBe(true);
      expect(h.has("Content-Security-Policy-Report-Only")).toBe(true);
    });

    it("Permissions-Policy でカメラ・マイク・位置情報を無効にしている", async () => {
      const value = (await headersOf("production")).get("Permissions-Policy") ?? "";
      expect(value).toContain("camera=()");
      expect(value).toContain("microphone=()");
      expect(value).toContain("geolocation=()");
    });

    it("強制の Content-Security-Policy と Strict-Transport-Security は出さない", async () => {
      const keys = [...(await headersOf("production")).keys()].map((k) => k.toLowerCase());
      expect(keys).not.toContain("content-security-policy");
      expect(keys).not.toContain("strict-transport-security");
    });

    it("CSP に 'unsafe-eval' が無く、* 単独のソースも無い", async () => {
      const csp = (await headersOf("production")).get("Content-Security-Policy-Report-Only") ?? "";
      expect(csp).not.toContain("'unsafe-eval'");
      const sources = csp.split("; ").flatMap((d) => d.split(" ").slice(1));
      expect(sources).not.toContain("*");
      expect(csp).toContain("default-src 'self'");
    });

    it("ヘッダーの値に改行が無い", async () => {
      for (const value of (await headersOf("production")).values()) {
        expect(value).not.toMatch(/[\r\n]/);
      }
    });
  });

  describe("開発時のヘッダー", () => {
    it("CSP には 'unsafe-eval' がある（本番との差）", async () => {
      const csp = (await headersOf("development")).get("Content-Security-Policy-Report-Only") ?? "";
      expect(csp).toContain("'unsafe-eval'");
    });

    it("開発時も強制の CSP は出さない", async () => {
      const keys = [...(await headersOf("development")).keys()].map((k) => k.toLowerCase());
      expect(keys).not.toContain("content-security-policy");
    });
  });
});
