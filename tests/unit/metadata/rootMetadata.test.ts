// ルートメタデータ（qr_code_create-01z.1）: ルートレイアウト分割で metadata を
// src/lib/metadata/rootMetadata.ts に移した。日本語版は分割前と同じ値であることを固定する。
import { rootMetadataJa, rootMetadataEn } from "@/lib/metadata/rootMetadata";

// 期待値の出典: qr_code_create-av5 で検索語に合わせて更新した ja のルート title.default と description。
// template は分割前（src/app/layout.tsx、コミット f572393 時点）から不変。
const EXPECTED_JA_TITLE_DEFAULT = "無料のQRコード作成ツール（UTM対応） | QR Code Create";
const EXPECTED_JA_TITLE_TEMPLATE = "%s | QR Code Create";
const EXPECTED_JA_DESCRIPTION =
  "UTMパラメータ付きのQRコードを無料で作れるツールです。印刷物ごとに、どこで読み取られたかを測れます。会員登録は不要です。";
// metadataBase の期待値は実装と同じ式で作らず、値を直書きする（同語反復を避ける）
const DEFAULT_SITE_URL_HREF = "https://qr-create.jp/";
const SITE_URL_KEY = "NEXT_PUBLIC_SITE_URL";

type TitleObject = { default: string; template: string };
type RootMetadataModule = typeof import("@/lib/metadata/rootMetadata");

/** metadataBase はモジュール読み込み時に評価されるため、環境変数を設定してから isolateModules で読み込む */
function loadRootMetadata(siteUrl: string | undefined): RootMetadataModule {
  const original = process.env[SITE_URL_KEY];
  if (siteUrl === undefined) {
    delete process.env[SITE_URL_KEY];
  } else {
    process.env[SITE_URL_KEY] = siteUrl;
  }
  let mod: RootMetadataModule | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("@/lib/metadata/rootMetadata");
  });
  if (original === undefined) {
    delete process.env[SITE_URL_KEY];
  } else {
    process.env[SITE_URL_KEY] = original;
  }
  return mod!;
}

describe("metadataBase", () => {
  it("NEXT_PUBLIC_SITE_URL が未設定なら ja / en とも https://qr-create.jp/ であること", () => {
    const mod = loadRootMetadata(undefined);
    expect(mod.rootMetadataJa.metadataBase).toBeInstanceOf(URL);
    expect(String(mod.rootMetadataJa.metadataBase)).toBe(DEFAULT_SITE_URL_HREF);
    expect(String(mod.rootMetadataEn.metadataBase)).toBe(DEFAULT_SITE_URL_HREF);
  });

  it("NEXT_PUBLIC_SITE_URL が設定されていれば ja / en ともその値であること", () => {
    const mod = loadRootMetadata("https://staging.example.com");
    expect(String(mod.rootMetadataJa.metadataBase)).toBe("https://staging.example.com/");
    expect(String(mod.rootMetadataEn.metadataBase)).toBe("https://staging.example.com/");
  });
});

describe("rootMetadataJa", () => {
  it("title.default と title.template が分割前と同じであること", () => {
    const title = rootMetadataJa.title as TitleObject;
    expect(title.default).toBe(EXPECTED_JA_TITLE_DEFAULT);
    expect(title.template).toBe(EXPECTED_JA_TITLE_TEMPLATE);
  });

  it("description が分割前と同じであること", () => {
    expect(rootMetadataJa.description).toBe(EXPECTED_JA_DESCRIPTION);
  });
});

describe("rootMetadataEn", () => {
  const isAscii = (s: string) => /^[\x20-\x7E]+$/.test(s);

  it("title.template が %s | QR Code Create であること", () => {
    const title = rootMetadataEn.title as TitleObject;
    expect(title.template).toBe("%s | QR Code Create");
  });

  it("title.default と description が英語（ASCII のみ）であること", () => {
    const title = rootMetadataEn.title as TitleObject;
    expect(isAscii(title.default)).toBe(true);
    expect(typeof rootMetadataEn.description).toBe("string");
    expect(isAscii(rootMetadataEn.description as string)).toBe(true);
  });

  it("title.default と description が日本語版と異なること", () => {
    const title = rootMetadataEn.title as TitleObject;
    expect(title.default).not.toBe(EXPECTED_JA_TITLE_DEFAULT);
    expect(rootMetadataEn.description).not.toBe(EXPECTED_JA_DESCRIPTION);
  });
});
