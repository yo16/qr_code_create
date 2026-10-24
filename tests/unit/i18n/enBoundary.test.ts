import fs from "fs";
import path from "path";

/**
 * en / enClient の import 境界（qr_code_create-01z.4）。
 * 英語の文字列が ja ページの Client バンドルに入らないよう、
 * en と enClient を import してよいのは Server 専用の辞書取得口だけに限る。
 */

const ROOT = process.cwd();

/** en（全辞書）を import してよいファイル */
const EN_IMPORT_ALLOWLIST = ["src/i18n/getDict.ts"];
/** enClient を import してよいファイル */
const EN_CLIENT_IMPORT_ALLOWLIST = ["src/i18n/en.ts"];

/** `from "@/i18n/en"` / `"./en"` / `"../en"`（enClient は含まない） */
const EN_IMPORT = /from\s+["'](?:@\/i18n\/en|\.\/en|\.\.\/en)["']/;
const EN_CLIENT_IMPORT = /from\s+["'](?:@\/i18n\/enClient|\.\/enClient|\.\.\/enClient)["']/;

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

describe("en / enClient の import 境界", () => {
  const files = listSources("src");

  // 意図: 走査が空振りしていない
  it("src 配下を走査し en.ts / enClient.ts を含む", () => {
    expect(files.length).toBeGreaterThan(50);
    expect(files).toContain("src/i18n/en.ts");
    expect(files).toContain("src/i18n/enClient.ts");
  });

  // 意図: en を import するのは getDict.ts だけ
  it("en を import するファイルは getDict.ts だけ", () => {
    const importers = files.filter((f) => EN_IMPORT.test(read(f)));
    expect(importers).toEqual(EN_IMPORT_ALLOWLIST);
  });

  // 意図: enClient を import するのは en.ts だけ（Client コンポーネントから直接読まない）
  it("enClient を import するファイルは en.ts だけ", () => {
    const importers = files.filter((f) => EN_CLIENT_IMPORT.test(read(f)));
    expect(importers).toEqual(EN_CLIENT_IMPORT_ALLOWLIST);
  });

  // 意図: 正規表現が en と enClient を区別する（検査ロジックの確認）
  it("EN_IMPORT は enClient にマッチせず、EN_CLIENT_IMPORT は en にマッチしない", () => {
    expect(EN_IMPORT.test('import { enClient } from "./enClient";')).toBe(false);
    expect(EN_IMPORT.test('import { enClient } from "@/i18n/enClient";')).toBe(false);
    expect(EN_IMPORT.test('import { en } from "@/i18n/en";')).toBe(true);
    expect(EN_IMPORT.test('import { en } from "./en";')).toBe(true);
    expect(EN_CLIENT_IMPORT.test('import { en } from "./en";')).toBe(false);
    expect(EN_CLIENT_IMPORT.test('import { enClient } from "./enClient";')).toBe(true);
  });
});
