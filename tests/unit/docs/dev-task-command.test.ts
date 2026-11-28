/**
 * @jest-environment node
 */
// qr_code_create-mud: /dev-task のステップ6 が npm run test:built を指し、
// 規則 mandatory-testing.md と食い違わないことを守る。
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../../..");
const read = (rel: string): string => fs.readFileSync(path.join(ROOT, rel), "utf8");

// 「## ステップ6」の見出しから次の「## 」の見出し（または末尾）までを切り出す
export function extractStep6(src: string): string {
  const start = src.search(/^## ステップ6/m);
  if (start < 0) return "";
  const rest = src.slice(start);
  const afterHeading = rest.indexOf("\n");
  const next = rest.slice(afterHeading + 1).search(/^## /m);
  return next < 0 ? rest : rest.slice(0, afterHeading + 1 + next);
}

// 節の問題を文字列の配列で返す（空配列なら問題なし）
export function findStep6Problems(section: string): string[] {
  const problems: string[] = [];
  if (section.trim() === "") {
    problems.push("ステップ6の節が空");
    return problems;
  }
  if (!section.includes("npm run test:built")) {
    problems.push("npm run test:built がない");
  }
  const sentences = section.split(/[。\n]/);
  for (const s of sentences) {
    // `npm test` 単体（test:built を含む npm run test:built は別）に触れる文
    if (/npm test(?![:\w])/.test(s) && !s.includes("途中")) {
      problems.push(`npm test に触れる文に「途中」がない: ${s.trim()}`);
    }
  }
  return problems;
}

describe("dev-task.md のステップ6", () => {
  const devTask = read(".claude/commands/dev-task.md");
  const section = extractStep6(devTask);

  it("ステップ6の節を切り出せ、空でない", () => {
    expect(section.trim()).not.toBe("");
    expect(section).toMatch(/^## ステップ6/);
    expect(section).not.toMatch(/ステップ7/);
  });

  it("節に npm run test:built がある", () => {
    expect(section).toContain("npm run test:built");
  });

  it("npm test に触れる文は「途中」と同じ文にある", () => {
    expect(findStep6Problems(section)).toEqual([]);
  });
});

describe("規則 mandatory-testing.md との整合", () => {
  const rule = read(".claude/rules/mandatory-testing.md");

  it("npm run test:built があり、ステップ6に触れている", () => {
    expect(rule).toContain("npm run test:built");
    expect(rule).toContain("ステップ6");
  });

  it("package.json の scripts に test:built がある", () => {
    const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
    expect(pkg.scripts["test:built"]).toBeTruthy();
  });
});

describe("findStep6Problems の負のテスト", () => {
  it("直す前の文を渡すと問題を返す", () => {
    const old =
      "## ステップ6: テスト実行\nテストは実際に`npm test`や`npx playwright test`等で実行し、結果を取得する。\n";
    expect(findStep6Problems(old).length).toBeGreaterThan(0);
  });

  it("npm run test:built がない節は問題を返す", () => {
    const s = "## ステップ6\n途中の確認は`npm test`で行う。\n";
    expect(findStep6Problems(s)).toContain("npm run test:built がない");
  });

  it("最終の実行として npm test を指す節は問題を返す", () => {
    const s = "## ステップ6\n`npm run test:built`も使えるが、最終は`npm test`で行う。\n";
    expect(findStep6Problems(s).length).toBeGreaterThan(0);
  });

  it("空の節は問題を返す", () => {
    expect(findStep6Problems("")).toEqual(["ステップ6の節が空"]);
  });

  it("正しい節では問題がない", () => {
    const s =
      "## ステップ6\n最終は`npm run test:built`で行う。`npm test`だけを流すのは途中の確認に限る。\n";
    expect(findStep6Problems(s)).toEqual([]);
  });
});
