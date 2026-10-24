import fs from "fs";
import path from "path";
import { ja } from "@/i18n/ja";
import { jaClient } from "@/i18n/jaClient";
import { CLIENT_SLICE_KEYS } from "@/i18n/types";

const ROOT = process.cwd();

/**
 * ja（Server スライスを含む全辞書）を import してよいファイル。
 * Client バンドルに Server スライスが載らないよう、Server 側に限る。
 * - src/i18n/getDict.ts: Server 専用の辞書取得口
 * - src/i18n/types.ts: `import type` で Dict 型を作るだけ（実行時の値は入らない）
 * - src/lib/metadata/buildMetadata.ts: PAGE_METADATA（Server の generateMetadata で使う）
 * - src/lib/metadata/rootMetadata.ts: ルートレイアウトの metadata（Server）
 */
const JA_IMPORT_ALLOWLIST = [
  "src/i18n/getDict.ts",
  "src/i18n/types.ts",
  "src/lib/metadata/buildMetadata.ts",
  "src/lib/metadata/rootMetadata.ts",
];

/** Client からも読まれるため jaClient だけを使うべきファイル */
const JA_CLIENT_USERS = [
  "src/i18n/useDict.ts",
  "src/lib/url/validateUrl.ts",
  "src/lib/qr/frameRenderer.ts",
  "src/lib/constants/utmPresets.ts",
  "src/lib/constants/decorationPresets.ts",
];

/** `from "@/i18n/ja"` / `"./ja"` / `"../ja"`（jaClient は含まない） */
const JA_IMPORT = /from\s+["'](?:@\/i18n\/ja|\.\/ja|\.\.\/ja)["']/;
const JA_CLIENT_IMPORT = /from\s+["'](?:@\/i18n\/jaClient|\.\/jaClient|\.\.\/jaClient)["']/;
const USE_CLIENT = /^\s*["']use client["']/m;

function listSources(dir: string): string[] {
  return fs
    .readdirSync(path.join(ROOT, dir), { withFileTypes: true })
    .flatMap((entry) => {
      const rel = path.posix.join(dir, entry.name);
      if (entry.isDirectory()) return listSources(rel);
      return entry.isFile() && /\.tsx?$/.test(entry.name) ? [rel] : [];
    });
}

const read = (file: string) => fs.readFileSync(path.join(ROOT, file), "utf8");

describe("ja / jaClient の import 境界", () => {
  const files = listSources("src");

  // 意図: 走査が空振りしていない
  it("src 配下の .ts / .tsx を走査している", () => {
    expect(files.length).toBeGreaterThan(50);
    expect(files).toContain("src/i18n/ja.ts");
  });

  // 意図: ja を import するファイルが許可リストに収まる（Server スライスの Client 流入防止）
  it("ja を import するファイルは許可リストの中だけ", () => {
    const importers = files.filter((f) => JA_IMPORT.test(read(f)));
    expect(importers.length).toBeGreaterThan(0);
    expect(importers.filter((f) => !JA_IMPORT_ALLOWLIST.includes(f))).toEqual(
      []
    );
  });

  // 意図: "use client" のファイルは ja を import しない
  it('"use client" のファイルは ja を import しない', () => {
    const clientFiles = files.filter((f) => USE_CLIENT.test(read(f)));
    expect(clientFiles.length).toBeGreaterThan(0);
    expect(clientFiles.filter((f) => JA_IMPORT.test(read(f)))).toEqual([]);
  });

  // 意図: Client からも読まれるモジュールは jaClient を使い、ja を使わない
  it.each(JA_CLIENT_USERS)("%s は jaClient を import し ja を import しない", (file) => {
    const source = read(file);
    expect(JA_CLIENT_IMPORT.test(source)).toBe(true);
    expect(JA_IMPORT.test(source)).toBe(false);
  });

  // 意図: 正規表現が jaClient を ja と誤認しない（検査ロジックの確認）
  it("JA_IMPORT は jaClient の import にマッチしない", () => {
    expect(JA_IMPORT.test('import { jaClient } from "@/i18n/jaClient";')).toBe(false);
    expect(JA_IMPORT.test('import { jaClient } from "./jaClient";')).toBe(false);
    expect(JA_IMPORT.test('import { ja } from "@/i18n/ja";')).toBe(true);
    expect(JA_IMPORT.test('import type { ja } from "./ja";')).toBe(true);
  });
});

describe("jaClient と ja の関係", () => {
  // 意図: jaClient は Client スライスちょうど
  it("Object.keys(jaClient) が CLIENT_SLICE_KEYS と一致する", () => {
    expect(Object.keys(jaClient).sort()).toEqual([...CLIENT_SLICE_KEYS].sort());
  });

  // 意図: ja の Client スライスは jaClient と同一参照（二重定義していない）
  it.each([...CLIENT_SLICE_KEYS])("ja.%s は jaClient の同じオブジェクト", (key) => {
    expect(ja[key]).toBe(jaClient[key]);
  });
});
