/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";

/** qr_code_create-w4d: service-readme v1 の適用（ルールファイル、README の「サービス情報」節、導入記録）を検査する */

const ROOT = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf-8");

const KEYS = [
  "サービス名",
  "段階",
  "GitHub リポジトリ",
  "URL",
  "インフラ",
  "説明",
  "公開日",
  "UptimeRobot monitor ID",
] as const;
const STAGES = ["企画", "開発中", "公開中", "休止", "終了"];

type Parsed = { ok: boolean; errors: string[]; values: Record<string, string> };

function isRealDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

const cells = (l: string) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const SEPARATOR = /^\|\s*:?-{3,}:?\s*\|\s*:?-{3,}:?\s*\|$/;

/** URL として解釈でき、クエリと認証情報を含まないことを検証する。問題があれば errors に足す */
function checkUrl(label: string, s: string, errors: string[]): void {
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    errors.push(`${label} の形式が不正（URL として解釈できない）`);
    return;
  }
  if (u.protocol !== "https:" || !u.hostname) errors.push(`${label} の形式が不正（https ではない）`);
  if (u.search !== "") errors.push(`${label} にクエリがある`);
  if (u.username !== "" || u.password !== "") errors.push(`${label} に認証情報がある`);
}

/** README の「サービス情報」節を解析し、構造と値の形式を検証する */
function parseServiceInfo(readme: string): Parsed {
  const errors: string[] = [];
  const values: Record<string, string> = {};
  const lines = readme.split(/\r?\n/);
  if (!/^# /.test(lines[0] ?? "")) errors.push("1 行目が「# 」で始まる H1 ではない");
  const h2 = lines.map((l, i) => ({ l, i })).filter((x) => x.l.startsWith("## "));
  const sections = h2.filter((x) => x.l.trim() === "## サービス情報");
  if (sections.length !== 1) {
    errors.push(`「## サービス情報」節が ${sections.length} 個`);
    return { ok: false, errors, values };
  }
  if (sections[0].i === 0) errors.push("サービス情報が H1 より前にある");
  if (h2[0].l.trim() !== "## サービス情報") errors.push("最初の ## 見出しではない");
  const start = sections[0].i + 1;
  const next = h2.find((x) => x.i > sections[0].i);
  const body = lines.slice(start, next ? next.i : lines.length).filter((l) => l.trim().startsWith("|"));
  if (body.length < 2 || cells(body[0]).join("|") !== "項目|内容") errors.push("ヘッダーが「| 項目 | 内容 |」ではない");
  if (body.length < 2 || !SEPARATOR.test(body[1].trim())) errors.push("区切り行が「|---|---|」形式ではない");
  const rows = body.slice(2).map(cells);
  if (rows.length !== KEYS.length) errors.push(`行数が ${rows.length}（8 が必要）`);
  const seen = new Set<string>();
  rows.forEach((r, i) => {
    if (r.length !== 2) {
      errors.push(`${i + 1} 行目の列数が ${r.length}（2 が必要）`);
      return;
    }
    if (seen.has(r[0])) errors.push(`${r[0]} が重複`);
    seen.add(r[0]);
    if (r[0] !== KEYS[i]) errors.push(`${i + 1} 行目の項目が ${r[0]}（${KEYS[i]} が必要）`);
    if (!r[1]) errors.push(`${r[0]} の値が空`);
    values[r[0]] = r[1] ?? "";
  });
  if (errors.length > 0) return { ok: false, errors, values };

  const v = values;
  if (!STAGES.includes(v["段階"])) errors.push("段階が不正");
  if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(v["GitHub リポジトリ"])) errors.push("GitHub の形式が不正");
  checkUrl("GitHub", v["GitHub リポジトリ"], errors);
  if (v["URL"] !== "未定") checkUrl("URL", v["URL"], errors);
  if (!(v["公開日"] === "未公開" || isRealDate(v["公開日"]))) errors.push("公開日の形式が不正");
  if (!(v["UptimeRobot monitor ID"] === "なし" || /^\d+([、,]\s*\d+)*$/.test(v["UptimeRobot monitor ID"]))) {
    errors.push("monitor ID の形式が不正");
  }
  if (v["段階"] === "公開中" && v["公開日"] === "未公開") errors.push("公開中なのに公開日が未公開");
  const hasUptime = v["インフラ"].includes("UptimeRobot");
  const hasId = v["UptimeRobot monitor ID"] !== "なし";
  if (hasUptime !== hasId) errors.push("インフラの UptimeRobot と monitor ID が矛盾");
  return { ok: errors.length === 0, errors, values };
}

const SECRET_PATTERNS = [
  /api_?key/i,
  /token=/i,
  /access_token/i,
  /password/i,
  /secret/i,
  /bearer/i,
  /[?&]key=/i,
  /\b[um]r?[0-9]+-[0-9a-f]{8,}/i, // UptimeRobot のアカウント API キー（u123-...）とモニター用キー（m123-...）
  /\/\/[^\s/@:]+:[^\s/@]*@/, // https://user:pass@host
];
function findSecrets(text: string): string[] {
  return SECRET_PATTERNS.filter((p) => p.test(text)).map(String);
}

const row = (k: string, v: string) => `| ${k} | ${v} |`;
function buildReadme(over: Partial<Record<(typeof KEYS)[number], string>> = {}, keys: readonly string[] = KEYS): string {
  const base: Record<string, string> = {
    サービス名: "X",
    段階: "公開中",
    "GitHub リポジトリ": "https://github.com/a/b",
    URL: "https://example.com/",
    インフラ: "Vercel、UptimeRobot",
    説明: "説明",
    公開日: "2026-04-10",
    "UptimeRobot monitor ID": "123",
    ...over,
  };
  return ["# t", "説明", "", "## サービス情報", "", "| 項目 | 内容 |", "|---|---|", ...keys.map((k) => row(k, base[k])), ""].join("\n");
}

function expectFail(r: Parsed, fragment: string): void {
  expect(r.ok).toBe(false);
  expect(r.errors.some((e) => e.includes(fragment))).toBe(true);
}

describe("service-readme: ルールファイル", () => {
  const rule = read(".claude/rules/service-readme.md");

  it("見出しと必須の節を含む", () => {
    expect(rule).toContain("# サービスの基本情報を README.md の「サービス情報」節に書く");
    for (const h of ["## 置く場所", "## 書く内容", "## 更新するとき", "## 節がないとき"]) {
      expect(rule).toContain(h);
    }
  });

  it("「書く内容」の表の項目名が、テストの KEYS と同じ順序で一致する", () => {
    const lines = rule.split(/\r?\n/);
    const start = lines.findIndex((l) => l.trim() === "## 書く内容");
    expect(start).toBeGreaterThanOrEqual(0);
    const rest = lines.slice(start + 1);
    const end = rest.findIndex((l) => /^#{2,3} /.test(l));
    const table = (end === -1 ? rest : rest.slice(0, end)).filter((l) => l.trim().startsWith("|"));
    expect(cells(table[0]).slice(0, 2)).toEqual(["項目", "内容"]);
    expect(SEPARATOR.test(table[1].trim())).toBe(true);
    expect(table.slice(2).map((l) => cells(l)[0])).toEqual([...KEYS]);
  });

  it("段階の 5 値が本文にある", () => {
    for (const s of STAGES) expect(rule).toContain(s);
  });

  it("空欄にしないことと秘密の値を書かないことが明記されている", () => {
    expect(rule).toContain("空欄にしない");
    expect(rule).toContain("秘密の値は書かない");
  });
});

describe("service-readme: README の「サービス情報」節", () => {
  const readme = read("README.md");
  const parsed = parseServiceInfo(readme);

  it("構造と値の形式の検証を通る", () => {
    expect(parsed.errors).toEqual([]);
    expect(parsed.ok).toBe(true);
  });

  it("1 行目が H1 で、「## サービス情報」がその後にある", () => {
    const lines = readme.split(/\r?\n/);
    expect(lines[0]).toMatch(/^# \S/);
    const idx = lines.findIndex((l) => l.trim() === "## サービス情報");
    expect(idx).toBeGreaterThan(0);
  });

  it("8 項目が決められた順に並び、どの値も空でない", () => {
    expect(Object.keys(parsed.values)).toEqual([...KEYS]);
    for (const k of KEYS) expect(parsed.values[k].length).toBeGreaterThan(0);
  });

  it("現在の値が固定されている", () => {
    expect(parsed.values["サービス名"]).toBe("QR Code Create");
    expect(parsed.values["段階"]).toBe("公開中");
    expect(parsed.values["GitHub リポジトリ"]).toBe("https://github.com/yo16/qr_code_create");
    expect(parsed.values["URL"]).toBe("https://qr-create.jp/");
    expect(parsed.values["公開日"]).toBe("2026-04-10");
    expect(parsed.values["UptimeRobot monitor ID"]).toBe("804540650");
  });

  it("README に秘密の値がない", () => {
    expect(findSecrets(readme)).toEqual([]);
  });
});

describe("service-readme: 導入記録", () => {
  const lines = read(".claude/claudecode-initial-settings-history.txt").split(/\r?\n/);
  it("1 行目が注意書きで、smallpiece-link と service-readme の記録がある", () => {
    expect(lines[0]).toBe("# claudecode-initial-settings の導入記録。Claude Code への指示ではない。");
    expect(lines).toContain("smallpiece-link@v1 2026-11-03");
    expect(lines).toContain("service-readme@v1 2026-11-10");
  });
});

describe("parseServiceInfo (正常系と境界)", () => {
  it("正常な入力は ok", () => {
    expect(parseServiceInfo(buildReadme()).errors).toEqual([]);
  });
  it("未定・未公開・なしの組み合わせは ok", () => {
    const r = buildReadme({ 段階: "企画", URL: "未定", 公開日: "未公開", インフラ: "Vercel", "UptimeRobot monitor ID": "なし" });
    expect(parseServiceInfo(r).errors).toEqual([]);
  });
  it("monitor ID は読点区切りの複数でもよい", () => {
    expect(parseServiceInfo(buildReadme({ "UptimeRobot monitor ID": "123、456" })).ok).toBe(true);
  });
  it("monitor ID は半角カンマ区切りの複数でもよい", () => {
    expect(parseServiceInfo(buildReadme({ "UptimeRobot monitor ID": "123,456" })).ok).toBe(true);
  });
});

describe("parseServiceInfo (構造の異常系)", () => {
  it("節がない README は失敗", () => {
    expectFail(parseServiceInfo("# t\n説明\n"), "節が 0 個");
  });
  it("節が 2 つあると失敗", () => {
    const r = buildReadme();
    expectFail(parseServiceInfo(r + "\n" + r), "節が 2 個");
  });
  it("他の ## 見出しが先にあると失敗", () => {
    expectFail(parseServiceInfo("# t\n## 先\n" + buildReadme()), "最初の ## 見出しではない");
  });
  it("1 行目が H1 でないと失敗", () => {
    const r = buildReadme().replace("# t\n", "");
    expectFail(parseServiceInfo(r), "H1");
  });
  it("1 行目が ## 見出しだと H1 とは認めず失敗", () => {
    const r = buildReadme().replace("# t\n", "## 先\n");
    expectFail(parseServiceInfo(r), "H1");
  });
  it("ヘッダー行が違うと失敗", () => {
    expectFail(parseServiceInfo(buildReadme().replace("| 項目 | 内容 |", "| 項目 | 値 |")), "ヘッダー");
  });
  it("区切り行がないと失敗", () => {
    expectFail(parseServiceInfo(buildReadme().replace("|---|---|\n", "")), "区切り行");
  });
  it("区切り行の形が違うと失敗", () => {
    expectFail(parseServiceInfo(buildReadme().replace("|---|---|", "|---|")), "区切り行");
  });
  it("項目が欠けた表は失敗", () => {
    expectFail(parseServiceInfo(buildReadme({}, KEYS.slice(0, 7))), "行数が 7");
  });
  it("9 行以上の表は失敗", () => {
    const r = buildReadme().trimEnd() + "\n" + row("予備", "x") + "\n";
    expectFail(parseServiceInfo(r), "行数が 9");
  });
  it("同じ項目が重複する表は失敗", () => {
    expectFail(parseServiceInfo(buildReadme({}, [...KEYS.slice(0, 7), "サービス名"])), "重複");
  });
  it("3 列以上の行がある表は失敗", () => {
    expectFail(parseServiceInfo(buildReadme().replace("| 説明 | 説明 |", "| 説明 | 説明 | 余分 |")), "列数");
  });
  it("順序が違う表は失敗", () => {
    const swapped = [...KEYS];
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    expectFail(parseServiceInfo(buildReadme({}, swapped)), "項目が");
  });
  it("空欄がある表は失敗", () => {
    expectFail(parseServiceInfo(buildReadme({ 説明: "" })), "説明 の値が空");
  });
});

describe("parseServiceInfo (値の異常系)", () => {
  it.each([
    ["段階が不正", { 段階: "運用中" }, "段階が不正"],
    ["GitHub が http", { "GitHub リポジトリ": "http://github.com/a/b" }, "GitHub の形式が不正"],
    ["GitHub にクエリがある", { "GitHub リポジトリ": "https://github.com/a/b?x=1" }, "GitHub の形式が不正"],
    ["URL が https でない", { URL: "http://example.com/" }, "URL の形式が不正"],
    ["URL が https:// だけ", { URL: "https://" }, "URL の形式が不正"],
    ["URL にトークンのクエリがある", { URL: "https://x.example/?token=a" }, "URL にクエリがある"],
    ["URL にユーザー情報がある", { URL: "https://user:pass@x.example/" }, "URL に認証情報がある"],
    ["公開日が実在しない", { 公開日: "2026-02-30" }, "公開日の形式が不正"],
    ["公開中なのに未公開", { 公開日: "未公開" }, "公開日が未公開"],
    ["monitor ID が数字でない", { "UptimeRobot monitor ID": "abc" }, "monitor ID の形式が不正"],
    ["monitor ID の末尾に区切りがある", { "UptimeRobot monitor ID": "123、" }, "monitor ID の形式が不正"],
    ["UptimeRobot があるのに ID がなし", { "UptimeRobot monitor ID": "なし" }, "矛盾"],
    ["UptimeRobot がないのに ID がある", { インフラ: "Vercel" }, "矛盾"],
  ] as const)("%s は失敗", (_n, over, fragment) => {
    expectFail(parseServiceInfo(buildReadme(over)), fragment);
  });
});

describe("findSecrets (秘密の検出)", () => {
  it.each([
    "api_key: x",
    "ApiKey=1",
    "token=abc",
    "access_token: abc",
    "Password",
    "client secret",
    "Authorization: Bearer abc",
    "https://x.example/?key=abc",
    "https://x.example/?a=1&key=abc",
    "https://user:pass@x.example/",
    "ur1234567-abcdef0123456789",
    "u1234567-abcdef0123456789",
    "m1234567-abcdef0123456789",
  ])("%s を検出する", (s) => {
    expect(findSecrets(s).length).toBeGreaterThan(0);
  });
  it.each([
    "UptimeRobot monitor ID 804540650",
    "| 公開日 | 2026-04-10 |",
    "https://github.com/yo16/qr_code_create",
    "https://qr-create.jp/",
  ])("秘密を含まない文字列 %s は検出しない", (s) => {
    expect(findSecrets(s)).toEqual([]);
  });
});
