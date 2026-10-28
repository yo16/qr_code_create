import fs from "fs";
import path from "path";

/** 多言語 M1: src に "en" の直書き比較（=== "en" など）が残らないこと */

const ROOT = process.cwd();
const EN_COMPARE = /[!=]==?\s*["']en["']/;

function listSources(dir: string): string[] {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) return listSources(rel);
    return entry.isFile() && /\.tsx?$/.test(entry.name) ? [rel] : [];
  });
}

describe("src に en の直書き比較が無い", () => {
  const files = listSources("src");

  it("走査対象が空でなく routes.ts を含む", () => {
    expect(files.length).toBeGreaterThan(50);
    expect(files).toContain("src/lib/i18n/routes.ts");
  });

  it("どのファイルにも === \"en\" / !== \"en\" が無い", () => {
    const offenders = files.filter((f) =>
      EN_COMPARE.test(fs.readFileSync(path.join(ROOT, f), "utf8"))
    );
    expect(offenders).toEqual([]);
  });

  it("検査の正規表現が各形式にマッチする", () => {
    expect(EN_COMPARE.test('locale === "en"')).toBe(true);
    expect(EN_COMPARE.test("locale !== 'en'")).toBe(true);
    expect(EN_COMPARE.test('locale == "en"')).toBe(true);
    expect(EN_COMPARE.test('locale !== "ja"')).toBe(false);
  });
});
