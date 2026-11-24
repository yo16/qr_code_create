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
    // 「十分な余白」は数値の目安ではない。除くのは、前に数詞がなく、後ろが「に」「な」「です」「で」「だ」「か」「、」「。」
    // または文字列の終わりの「十分」だけ。「三十分」「数十分」「十分間」「十分ごと」「十分後」などは除かない
    .replace(/(?<![0-9０-９一二三四五六七八九十百千万数])十分(?=に|な|です|で|だ|か|、|。|$)/g, "");
  const found: string[] = [];
  found.push(...(rest.match(/[0-9０-９]/g) ?? []));
  found.push(
    ...(rest.match(
      /[一二三四五六七八九十百千万数]+\s*(?:秒|分|時間|メートル|センチ|ミリ|インチ|倍|割|ピクセル|画素)/g
    ) ?? [])
  );
  // 漢数字の期間（二週間、数日、三か月、半年、一年 など）。「半」は「半年」「半日」の形
  found.push(...(rest.match(/[一二三四五六七八九十百数半]+\s*(?:週間|週|か月|ヶ月|カ月|日|年)/g) ?? []));
  return found;
}

// リンク先をすべて拾う。インライン（タイトル付き含む）、参照定義、自動リンク、素の URL。
// 同じリンクを二重に数えないよう、拾った箇所は順に取り除く。
function extractLinkTargets(text: string): string[] {
  const targets: string[] = [];
  let rest = text.replace(/`[^`]*`/g, " "); // コードスパンの中はリンクではない
  const take = (re: RegExp) => {
    rest = rest.replace(re, (...args: unknown[]) => {
      targets.push(args[1] as string);
      return " ";
    });
  };
  take(/\]\(\s*<?([^)\s>]*)>?(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g);
  take(/^[ ]{0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?.*$/gm);
  take(/<([a-zA-Z][a-zA-Z0-9+.-]*:[^>\s]*)>/g);
  take(/(https?:\/\/[^\s<>)\]"']+)/g);
  return targets;
}

// /create（ちょうど、または ? # が続く）か /guide/ で始まるリンク先だけを許す。
function isAllowedLink(l: string): boolean {
  return l === "/create" || /^\/create[?#]/.test(l) || l.startsWith("/guide/");
}

// 許されないリンク先を返す。
function findBadLinks(text: string): string[] {
  return extractLinkTargets(text).filter((l) => !isAllowedLink(l));
}

const FEATURE_WORDS = ["自動", "一括", "予約", "スケジュール", "配信", "連携", "管理画面", "ダッシュボード", "アップロード", "同期"];

// ツールにない機能を主張している文を返す（文単位）。
// 否定で終わる文と、サイネージ側の説明の文は許す。ただし主語がこのツールの文は許さない。
function findFeatureClaims(text: string): string[] {
  const sentences = text
    .split(/。|\n/)
    .map((s) => s.trim().replace(/[」』）)\s]+$/, ""))
    .filter((s) => s.length > 0);
  return sentences.filter((s) => {
    if (!FEATURE_WORDS.some((w) => s.includes(w))) return false;
    if (/(ません|ない)$/.test(s)) return false;
    const toolSubject = /(このツール|QR Code Create|本ツール|QRコード作成ツール|当ツール|当サイト|このサービス|本サービス)/.test(s);
    const signageSide = /(サイネージ側|配信システム|表示システム)/.test(s);
    return toolSubject || !signageSide;
  });
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

function splitLines(content: string): string[] {
  return content.replace(/\r\n/g, "\n").split("\n");
}

function extractHeadingLines(content: string = body): string[] {
  return splitLines(content).filter((l) => /^#{2,3} /.test(l));
}

function extractSection(content: string = body): string {
  const ls = splitLines(content);
  const start = ls.findIndex((l) => l === NEW_HEADING);
  if (start < 0) return "";
  let end = ls.findIndex((l, i) => i > start && /^## /.test(l));
  if (end < 0) end = ls.length;
  return ls.slice(start + 1, end).join("\n");
}

const lines = splitLines(body);
const headingLines = extractHeadingLines();
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
  const links = extractLinkTargets(section).filter((l) => l.startsWith("/"));

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
    const all = extractLinkTargets(section);
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
  it.each(["3秒", "数秒", "２メートル", "三秒", "数メートル", "約10分", "二倍", "5割", "三十分", "数十分", "十分間", "約十分間", "十分ごと", "十分おき", "十分後"])(
    "数値の目安「%s」を違反として検出する",
    (s) => {
      expect(findNumericClaims(`この画面は${s}ほど表示します。`).length).toBeGreaterThan(0);
    }
  );

  it.each(["二週間", "数日", "三か月", "三ヶ月", "三カ月", "一年", "半年", "数週間", "十日", "百日", "九日", "一週"])(
    "漢数字の期間「%s」を数値の目安として検出する",
    (s) => {
      expect(findNumericClaims(`${s}で効果が出ます。`).length).toBeGreaterThan(0);
    }
  );

  it.each(["一般的", "一方", "一部", "数値", "年賀状", "日本", "毎日", "本日", "来年", "週末", "一定の期間", "数が多い"])(
    "期間でない語「%s」を含む文は違反にしない",
    (s) => {
      expect(findNumericClaims(`${s}な場合は表示を変えます。`)).toEqual([]);
    }
  );

  it.each(["4x", "1枚ずつ", "一定の時間", "十分に取る", "十分な余白", "`utm_content` を変える", "「出力解像度」を「4x」にする"])(
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
    '[x](/poster "t")',
    "[id]: https://example.com",
    "<https://example.com>",
    "https://example.com",
    "[x](/create-foo)",
    "[x](/createx)",
  ])("許されないリンク「%s」を検出する", (s) => {
    expect(findBadLinks(s)).toHaveLength(1);
  });

  it.each([
    "[x](/create)",
    "[x](/guide/download-formats)",
    "[x](/create?utm=1)",
    "[x](/create#step1)",
    '[x](/create "t")',
    '[x](/guide/download-formats "t")',
  ])("許されるリンク「%s」は検出しない", (s) => {
    expect(findBadLinks(s)).toEqual([]);
  });

  it.each(["QRコードを自動で配信します。", "スケジュールを予約できます。", "このツールはサイネージ側と連携して自動で配信します。", "QR Code Createがサイネージの配信を管理画面から同期します。", "サイネージの画面に自動で配信できます。", "QRコード作成ツールが、サイネージ側の配信スケジュールへ自動で同期します。"])(
    "ツールの機能の主張「%s」を違反として検出する",
    (s) => {
      expect(findFeatureClaims(s)).toHaveLength(1);
    }
  );

  it.each(["配信の予約機能はありません。", "サイネージ側の配信スケジュールに合わせて表示します。", "一括で差し替える機能はない。", "自動での配信には対応していません。"])(
    "否定やサイネージ側の説明「%s」は違反にしない",
    (s) => {
      expect(findFeatureClaims(s)).toEqual([]);
    }
  );

  it.each([
    ["/guide", false],
    ["/guide/", true],
    ["//example.com/create", false],
    ["/create/", false],
    ["/CREATE", false],
  ])("isAllowedLink(%s) は %s", (l, expected) => {
    expect(isAllowedLink(l)).toBe(expected);
  });

  it.each(["サイネージの表示位置を決めます。", "ツールで SVG をダウンロードします。"])(
    "禁止語を含まない文「%s」は違反にしない",
    (s) => {
      expect(findFeatureClaims(s)).toEqual([]);
    }
  );

  it("空の文字列では findFeatureClaims が空の配列を返す", () => {
    expect(findFeatureClaims("")).toEqual([]);
  });

  it("コードスパンの中の URL はリンクとして拾わない", () => {
    expect(extractLinkTargets("`https://example.com` と `[x](/poster)`")).toEqual([]);
  });

  it("CRLF の本文でも見出しの位置の検査と節の抽出が同じ結果になる", () => {
    const crlf = body.replace(/\r?\n/g, "\r\n");
    expect(extractHeadingLines(crlf)).toEqual(headingLines);
    expect(extractSection(crlf)).toBe(section);
    expect(extractSection(crlf).length).toBeGreaterThan(0);
  });

  it.each(['<a href="/create">x</a>', "href=/create"])("生のアンカー「%s」を検出する", (s) => {
    expect(hasRawAnchor(s)).toBe(true);
  });

  it("既存の節が 1 文字変わるとハッシュが変わる", () => {
    expect(hashExistingBody(body)).toBe(EXISTING_BODY_SHA256);
    expect(hashExistingBody(body.replace("## まとめ", "## まとめ。"))).not.toBe(EXISTING_BODY_SHA256);
  });

  it("改行が CRLF でも同じハッシュになる", () => {
    expect(hashExistingBody(body.replace(/\r?\n/g, "\r\n"))).toBe(EXISTING_BODY_SHA256);
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
    expect(findFeatureClaims(section)).toEqual([]);
  });

  it("機能がないという否定が 1 つはある", () => {
    expect(section).toMatch(/機能(は|が)(ありません|ない)/);
  });
});
