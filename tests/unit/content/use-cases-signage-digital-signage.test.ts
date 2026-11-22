/**
 * @jest-environment node
 */
// qr_code_create-cj9（GitHub Issue #1）: signage.mdx の節「デジタルサイネージにQRコードを表示するとき」を守る。
// 文言の細かい言い回しには依存せず、見出し・位置・リンク・語の有無で確かめる。
import fs from "fs";
import path from "path";
import crypto from "crypto";
import matter from "gray-matter";

const ROOT = process.cwd();
const FILE = path.join(ROOT, "src/content/use-cases/signage.mdx");
const raw = matter(fs.readFileSync(FILE, "utf-8"));
const body = raw.content;

const NEW_HEADING = "## デジタルサイネージにQRコードを表示するとき";
const BEFORE_HEADING = "## 屋外看板QRコードの注意点";
const AFTER_HEADING = "## まとめ";

const DASH = /[—―–‒]/;
const EMOJI = /\p{Extended_Pictographic}|️|‍/u;

// signage の既存の節を意図して直すときは、この値も更新する。
// 新しい節を除き、frontmatter を除いた本文（改行は \n にそろえる）の SHA-256。
const EXISTING_BODY_SHA256 = "36d7affdb1a77d1a577b06258cb802d261bd820c1b2b50a4e6fe28a258ee2583";

// ---- 検査ロジック（負のテストからも使う） ----

// 許容する表現を取り除いてから、数値の目安に当たる表現を探す。
function findNumericClaims(text: string): string[] {
  const rest = text
    .replace(/`[^`]*`/g, "") // コード表記（utm_content など）
    .replace(/\b\d+x\b/g, "") // ツールの選択肢の倍率
    .replace(/[0-9０-９]+枚/g, "") // 「1枚」
    .replace(/十分/g, ""); // 「十分に」は数値の目安ではない
  const found: string[] = [];
  found.push(...(rest.match(/[0-9０-９]/g) ?? []));
  found.push(
    ...(rest.match(
      /[一二三四五六七八九十百千万数]+\s*(?:秒|分|時間|メートル|センチ|ミリ|インチ|倍|割|ピクセル|画素)/g
    ) ?? [])
  );
  return found;
}

// /create か /guide/ で始まらないリンク先を返す。
function findBadLinks(text: string): string[] {
  const targets = [...text.matchAll(/\]\(([^)\s]*)\)/g)].map((m) => m[1]);
  return targets.filter((l) => !(l.startsWith("/create") || l.startsWith("/guide/")));
}

function hasRawAnchor(text: string): boolean {
  return /<a\s/i.test(text) || /href\s*=/i.test(text);
}

function hashExistingBody(content: string): string {
  const ls = content.replace(/\r\n/g, "\n").split("\n");
  const start = ls.findIndex((l) => l === NEW_HEADING);
  let rest = ls;
  if (start >= 0) {
    let end = ls.findIndex((l, i) => i > start && /^## /.test(l));
    if (end < 0) end = ls.length;
    rest = [...ls.slice(0, start), ...ls.slice(end)];
  }
  return crypto.createHash("sha256").update(rest.join("\n")).digest("hex");
}

const lines = body.split("\n");
const headingLines = lines.filter((l) => /^#{2,3} /.test(l));

function extractSection(): string {
  const start = lines.findIndex((l) => l === NEW_HEADING);
  if (start < 0) return "";
  let end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  if (end < 0) end = lines.length;
  return lines.slice(start + 1, end).join("\n");
}
const section = extractSection();

describe("signage.mdx の節の位置", () => {
  it("見出しがちょうど 1 つあること", () => {
    expect(lines.filter((l) => l === NEW_HEADING)).toHaveLength(1);
    expect(section.trim().length).toBeGreaterThan(0);
  });

  it("「屋外看板QRコードの注意点」より後、「まとめ」より前にあること", () => {
    const i = headingLines.indexOf(NEW_HEADING);
    const before = headingLines.indexOf(BEFORE_HEADING);
    const after = headingLines.indexOf(AFTER_HEADING);
    expect(i).toBeGreaterThanOrEqual(0);
    expect(before).toBeGreaterThanOrEqual(0);
    expect(after).toBeGreaterThanOrEqual(0);
    expect(i).toBeGreaterThan(before);
    expect(i).toBeLessThan(after);
  });

  it("既存の節の見出しが同じ順で残り、増えたのは新しい節の 1 つだけであること", () => {
    const original = [
      "## 看板にQRコードを掲載するメリット",
      "## 看板用QRコードの推奨UTM設定",
      "### 設置場所ごとの計測",
      "## 看板用QRコードのおすすめデザイン",
      "### プリセット: ポップ",
      "### デザインのコツ",
      "## 看板への印刷サイズの目安",
      "### 読み取り距離とQRコードサイズの関係",
      "### ダウンロード形式の選び方",
      "## 看板用QRコードの活用例",
      "## 看板と手元の配布物を組み合わせる",
      "## 屋外看板QRコードの注意点",
      NEW_HEADING,
      "## まとめ",
    ];
    expect(headingLines).toEqual(original);
  });
});

describe("signage.mdx の既存の節", () => {
  it("新しい節を除いた本文（frontmatter を除く）が追加前から変わっていないこと", () => {
    expect(hashExistingBody(body)).toBe(EXISTING_BODY_SHA256);
  });
});

describe("signage.mdx の frontmatter のキー", () => {
  it("キーの集合が決められた 7 つとちょうど一致し、order が 9 であること", () => {
    expect(Object.keys(raw.data).sort()).toEqual(
      ["title", "description", "date", "updated", "order", "utmSource", "preset"].sort()
    );
    expect(raw.data.order).toBe(9);
  });
});

describe("signage.mdx の frontmatter", () => {
  it("title / description / date / utmSource / preset が変わっておらず、updated が 2026-11-22 であること", () => {
    expect(raw.data.title).toBe("看板用QRコードの作り方と活用方法");
    expect(raw.data.description).toBe(
      "看板や屋外広告にQRコードを掲載して集客効果を高める方法を解説。大型印刷に適したサイズ設定、推奨UTM設定、デザインのコツを紹介します。"
    );
    expect(String(raw.data.date)).toBe("2026-04-17");
    expect(raw.data.utmSource).toBe("signage");
    expect(raw.data.preset).toBe("pop");
    expect(String(raw.data.updated)).toBe("2026-11-22");
  });
});

describe("節の話題", () => {
  it("utm_content による出し分け計測の話題があること", () => {
    expect(section).toContain("utm_content");
  });

  it("クワイエットゾーンとコントラストの話題があること", () => {
    expect(section).toContain("クワイエットゾーン");
    expect(section).toContain("コントラスト");
  });

  it("一定の間は同じ位置に表示し続ける話題があること", () => {
    expect(section).toContain("同じ位置");
  });

  it("SVG・PNG と出力解像度の話題があること", () => {
    expect(section).toContain("SVG");
    expect(section).toContain("PNG");
    expect(section).toContain("出力解像度");
  });
});

describe("節に書かれた UI の呼び名が実在すること", () => {
  it("「出力解像度」が jaClient.ts のラベルにあること", () => {
    const ja = fs.readFileSync(path.join(ROOT, "src/i18n/jaClient.ts"), "utf-8");
    expect(section).toContain("出力解像度");
    expect(ja).toMatch(/resolutionLabel:\s*"出力解像度"/);
  });

  it("節に出てくる倍率（4x など）が ResolutionSelector.tsx の選択肢にあること", () => {
    const src = fs.readFileSync(
      path.join(ROOT, "src/components/qr/DownloadPanel/ResolutionSelector.tsx"),
      "utf-8"
    );
    const multipliers = section.match(/\b\d+x\b/g) ?? [];
    expect(multipliers.length).toBeGreaterThan(0);
    for (const m of multipliers) {
      expect(src).toContain(`label: "${m}"`);
    }
  });
});

describe("節の中のリンク先が実在すること", () => {
  const links = [...section.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);

  it("内部リンクが 1 つ以上あり、/create がページとして存在すること", () => {
    expect(links.length).toBeGreaterThan(0);
    expect(links).toContain("/create");
    expect(fs.existsSync(path.join(ROOT, "src/app/(ja)/(tool)/create/page.tsx"))).toBe(true);
  });

  it("/guide/... が src/content/guide/ の .mdx に対応していること", () => {
    const guides = links.filter((l) => l.startsWith("/guide/"));
    expect(guides.length).toBeGreaterThan(0);
    for (const l of guides) {
      const slug = l.replace("/guide/", "").replace(/[#?].*$/, "");
      expect(fs.existsSync(path.join(ROOT, "src/content/guide", `${slug}.mdx`))).toBe(true);
    }
  });

  it("すべてのリンク先が /create か /guide/ で始まること（外部・相対リンクがない）", () => {
    const all = [...section.matchAll(/\]\(([^)\s]*)\)/g)].map((m) => m[1]);
    expect(all.length).toBeGreaterThan(0);
    expect(findBadLinks(section)).toEqual([]);
  });

  it("生の <a> タグや href= がないこと", () => {
    expect(section).not.toContain("<a ");
    expect(section).not.toContain("href=");
    expect(hasRawAnchor(section)).toBe(false);
  });
});

describe("検査ロジックが違反を実際に検出すること（負のテスト）", () => {
  it.each(["3秒", "数秒", "２メートル", "三秒", "数メートル", "約10分", "二倍", "5割"])(
    "数値の目安「%s」を違反として検出する",
    (s) => {
      expect(findNumericClaims(`この画面は${s}ほど表示します。`).length).toBeGreaterThan(0);
    }
  );

  it.each(["4x", "1枚ずつ", "一定の時間", "十分に取る", "`utm_content` を変える", "「出力解像度」を「4x」にする"])(
    "許容する表現「%s」は違反にしない",
    (s) => {
      expect(findNumericClaims(s)).toEqual([]);
    }
  );

  it.each([
    "[x](https://example.com)",
    "[x](guide/download-formats)",
    "[x](/poster)",
    "[x](http://example.com/create)",
  ])("許されないリンク「%s」を検出する", (s) => {
    expect(findBadLinks(s)).toHaveLength(1);
  });

  it.each(["[x](/create)", "[x](/guide/download-formats)"])("許されるリンク「%s」は検出しない", (s) => {
    expect(findBadLinks(s)).toEqual([]);
  });

  it.each(['<a href="/create">x</a>', "href=/create"])("生のアンカー「%s」を検出する", (s) => {
    expect(hasRawAnchor(s)).toBe(true);
  });

  it("既存の節が 1 文字変わるとハッシュが変わる", () => {
    expect(hashExistingBody(body)).toBe(EXISTING_BODY_SHA256);
    expect(hashExistingBody(body.replace("## まとめ", "## まとめ。"))).not.toBe(EXISTING_BODY_SHA256);
  });

  it("改行が CRLF でも同じハッシュになる", () => {
    expect(hashExistingBody(body.replace(/\n/g, "\r\n"))).toBe(EXISTING_BODY_SHA256);
  });
});

describe("節がやってはいけないことをしていないこと", () => {
  it("ダッシュ（— ― – ‒）と絵文字がない", () => {
    expect(section).not.toMatch(DASH);
    expect(section).not.toMatch(EMOJI);
  });

  it("太字（** と __）がない", () => {
    expect(section).not.toContain("**");
    expect(section).not.toContain("__");
  });

  it("箇条書き（- / * / + / 1. / ・ / ● / ■）がない", () => {
    expect(section).not.toMatch(/^\s*([-*+]|\d+[.)])\s/m);
    expect(section).not.toMatch(/^\s*[・●■]/m);
  });

  it("表（行頭の |）がない", () => {
    expect(section).not.toMatch(/^\s*\|/m);
  });

  it("根拠のない数値の目安（半角・全角数字、漢数字と単位の組）がない", () => {
    expect(findNumericClaims(section)).toEqual([]);
  });

  it("ツールにない機能を主張する語がない", () => {
    const words = ["自動", "一括", "予約", "スケジュール", "配信", "連携", "管理画面", "ダッシュボード", "アップロード", "同期"];
    for (const w of words) {
      expect(section).not.toContain(w);
    }
  });

  it("機能がないという否定が 1 つはある", () => {
    expect(section).toMatch(/機能(は|が)(ありません|ない)/);
  });
});
