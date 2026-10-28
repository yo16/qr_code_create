/**
 * @jest-environment node
 */
// 設計書 2.3 節「辞書のキーの欠けが型検査で検出される」の担保（qr_code_create-38x.9）。
// TypeScript Compiler API で tsconfig.json の設定を読み、対象ファイルを絞った Program で型検査する。
// (a) 本物の es / pt-br / de の辞書は型エラーにならない
// (b) Dict のキーを 1 つ欠いた辞書（仮想ファイル）は「プロパティが無い」型エラーになる
// (c) 余分なキーを足した辞書も型エラーになる
import path from "path";
import ts from "typescript";

const ROOT = process.cwd().replace(/\\/g, "/");
const VIRTUAL_DIR = `${ROOT}/tests/unit/i18n/__virtual__`;

const REAL_DICT_FILES = ["es.ts", "ptBr.ts", "de.ts"].map((f) => `${ROOT}/src/i18n/${f}`);

function loadOptions(): ts.CompilerOptions {
  const configPath = path.join(process.cwd(), "tsconfig.json");
  const read = ts.readConfigFile(configPath, ts.sys.readFile);
  expect(read.error).toBeUndefined();
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, process.cwd());
  // incremental / plugins は Program の型検査に不要。出力はしない
  return { ...parsed.options, noEmit: true, incremental: false, tsBuildInfoFile: undefined };
}

/** 仮想ファイル（名前 → 内容）と実ファイルを roots にして型検査し、ファイルごとの診断メッセージを返す */
function check(virtual: Record<string, string>, realFiles: string[] = []): Record<string, string[]> {
  const options = loadOptions();
  const virtualFiles = new Map(Object.entries(virtual).map(([name, text]) => [`${VIRTUAL_DIR}/${name}`, text]));
  const host = ts.createCompilerHost(options);
  const origGetSourceFile = host.getSourceFile.bind(host);
  const origFileExists = host.fileExists.bind(host);
  const origReadFile = host.readFile.bind(host);
  host.getSourceFile = (fileName, languageVersionOrOptions, onError, shouldCreate) => {
    const text = virtualFiles.get(fileName.replace(/\\/g, "/"));
    if (text !== undefined) return ts.createSourceFile(fileName, text, languageVersionOrOptions);
    return origGetSourceFile(fileName, languageVersionOrOptions, onError, shouldCreate);
  };
  host.fileExists = (f) => virtualFiles.has(f.replace(/\\/g, "/")) || origFileExists(f);
  host.readFile = (f) => virtualFiles.get(f.replace(/\\/g, "/")) ?? origReadFile(f);

  const roots = [...virtualFiles.keys(), ...realFiles];
  const program = ts.createProgram({ rootNames: roots, options, host });
  const out: Record<string, string[]> = {};
  for (const root of roots) {
    const sf = program.getSourceFile(root);
    expect(sf).toBeDefined();
    out[path.basename(root)] = [
      ...program.getSyntacticDiagnostics(sf),
      ...program.getSemanticDiagnostics(sf),
    ].map((d) => `TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`);
  }
  return out;
}

const HEADER = `import type { Dict } from "@/i18n/types";\nimport { de } from "@/i18n/de";\n`;

describe("辞書の型検査（TypeScript Compiler API）", () => {
  // 1 回の Program で全ケースを検査して時間を抑える
  let result: Record<string, string[]>;
  beforeAll(() => {
    result = check(
      {
        // (b) 最上位のキー footer を欠く
        "missingTop.ts": `${HEADER}const { footer, ...rest } = de;\nexport const bad: Dict = rest;\nexport const unused = footer;\n`,
        // (b) 入れ子のキー footer.privacy を欠く
        "missingNested.ts": `${HEADER}const { privacy, ...footer } = de.footer;\nexport const bad: Dict = { ...de, footer };\nexport const unused = privacy;\n`,
        // (c) 余分なキーを足す
        "extraTop.ts": `${HEADER}export const bad: Dict = { ...de, extraKey: "x" };\n`,
        // (c) 入れ子に余分なキーを足す
        "extraNested.ts": `${HEADER}export const bad: Dict = { ...de, footer: { ...de.footer, extraKey: "x" } };\n`,
        // 対照: 欠けも余分も無い辞書は通る
        "valid.ts": `${HEADER}export const ok: Dict = { ...de };\n`,
      },
      REAL_DICT_FILES
    );
  }, 120_000);

  // 意図 (a): 本物の辞書が型エラーにならない
  it.each(["es.ts", "ptBr.ts", "de.ts"])("(a) 本物の辞書 src/i18n/%s は型エラーが 0 件", (file) => {
    expect(result[file]).toEqual([]);
  });

  it("対照: 欠けも余分も無い仮想の辞書は型エラーが 0 件（検査が過剰に落とさない）", () => {
    expect(result["valid.ts"]).toEqual([]);
  });

  // 意図 (b): キーの欠けが検出される
  it("(b) 最上位のキー（footer）を欠く辞書が「プロパティが無い」型エラーになる", () => {
    const messages = result["missingTop.ts"].join("\n");
    expect(result["missingTop.ts"].length).toBeGreaterThan(0);
    expect(messages).toMatch(/footer/);
    expect(result["missingTop.ts"].some((m) => m.startsWith("TS2741") || m.startsWith("TS2739"))).toBe(true);
  });

  it("(b) 入れ子のキー（footer.privacy）を欠く辞書が型エラーになる", () => {
    const messages = result["missingNested.ts"].join("\n");
    expect(result["missingNested.ts"].length).toBeGreaterThan(0);
    expect(messages).toMatch(/privacy/);
  });

  // 意図 (c): 余分なキーが検出される
  it("(c) 余分なキーを足した辞書が型エラー（既知のプロパティではない）になる", () => {
    expect(result["extraTop.ts"].some((m) => m.startsWith("TS2353") && m.includes("extraKey"))).toBe(true);
  });

  it("(c) 入れ子に余分なキーを足した辞書も型エラーになる", () => {
    expect(result["extraNested.ts"].some((m) => m.includes("extraKey"))).toBe(true);
  });
});
