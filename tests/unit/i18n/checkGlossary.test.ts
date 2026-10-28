import fs from "fs";
import os from "os";
import path from "path";
import { getDict as realGetDict } from "@/i18n/getDict";
import { TERM_ANCHORS, TERM_IDS, TERM_REFERENCE, type Glossary } from "@/i18n/glossary/terms";
import type { Dict, Locale } from "@/i18n/types";
import { checkGlossary, flattenDict, placeholders, readGuideTexts, wordRegExp } from "../../helpers/glossary";

// checkGlossary は辞書を getDict から引くので、"en" の辞書だけ差し替えて失敗を起こす。
// ガイドは実在の src/content/en/guide を読む。
let mockEnOverride: Dict | null = null;
let mockEsOverride: Dict | null = null;

jest.mock("@/i18n/getDict", () => {
  const actual = jest.requireActual("@/i18n/getDict");
  return {
    ...actual,
    getDict: (locale: Locale) => {
      if (locale === "en" && mockEnOverride) return mockEnOverride;
      if (locale === "es" && mockEsOverride) return mockEsOverride;
      return actual.getDict(locale);
    },
  };
});

/** en の参照値から作った、実在の en 辞書とガイドで通る用語集 */
function validGlossary(): Glossary {
  const glossary = Object.fromEntries(
    TERM_IDS.map((id) => [id, { term: TERM_REFERENCE[id].en, forbidden: [] as string[] }])
  ) as unknown as Glossary;
  // en の辞書は "Design presets" と複数形なので、語境界つきの照合に合わせて複数形を訳語にする
  glossary.preset = { term: "presets", forbidden: [] };
  return glossary;
}

/** en 辞書の複製を作り、指定キーの値を差し替える（階層は a.b.c の形） */
function enWith(overrides: Record<string, string>, locale: Locale = "en"): Dict {
  const clone = JSON.parse(JSON.stringify(realGetDict(locale))) as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(overrides)) {
    const parts = key.split(".");
    let node = clone as Record<string, unknown>;
    for (const p of parts.slice(0, -1)) node = node[p] as Record<string, unknown>;
    node[parts[parts.length - 1]] = value;
  }
  return clone as unknown as Dict;
}

afterEach(() => {
  mockEnOverride = null;
  mockEsOverride = null;
  jest.restoreAllMocks();
});

describe("checkGlossary", () => {
  it("正しい用語集と実在の en 辞書・ガイドでは失敗が空", () => {
    expect(checkGlossary("en", validGlossary())).toEqual([]);
  });

  it("禁止語が辞書に混入すると失敗メッセージが返る", () => {
    const glossary = validGlossary();
    glossary.qrCode = { term: "QR code", forbidden: ["Download"] };
    const failures = checkGlossary("en", glossary);
    expect(failures.some((f) => f.includes("禁止語「Download」(qrCode)") && f.includes("辞書"))).toBe(true);
  });

  it("禁止語はガイド MDX の混入も検出する", () => {
    const glossary = validGlossary();
    glossary.qrCode = { term: "QR code", forbidden: ["UTM parameters"] };
    const failures = checkGlossary("en", glossary);
    expect(failures.some((f) => f.includes("src/content/en/guide/"))).toBe(true);
  });

  it("禁止語が語の一部にしか現れないときは検出しない", () => {
    const glossary = validGlossary();
    glossary.qrCode = { term: "QR code", forbidden: ["ownloa"] };
    expect(checkGlossary("en", glossary)).toEqual([]);
  });

  it("caseSensitiveForbidden が true なら大文字小文字を区別する", () => {
    const glossary = validGlossary();
    glossary.qrCode = { term: "QR code", forbidden: ["DOWNLOAD"] };
    expect(checkGlossary("en", glossary).length).toBeGreaterThan(0);
    expect(checkGlossary("en", glossary, { caseSensitiveForbidden: true })).toEqual([]);
  });

  it("addressForbidden の語が混入すると失敗が返る", () => {
    const failures = checkGlossary("en", validGlossary(), { addressForbidden: [/\bdownload\b/i] });
    expect(failures.some((f) => f.includes("呼びかけの禁止語"))).toBe(true);
  });

  it("addressForbidden に g フラグ付きの RegExp を渡しても判定がぶれない", () => {
    const withG = checkGlossary("en", validGlossary(), { addressForbidden: [/download/gi] });
    const withoutG = checkGlossary("en", validGlossary(), { addressForbidden: [/download/i] });
    expect(withG.length).toBeGreaterThan(0);
    expect(withG).toEqual(withoutG);
    // 同じ RegExp を繰り返し渡しても、lastIndex を持ち越さない
    const shared = /download/g;
    const first = checkGlossary("en", validGlossary(), { addressForbidden: [shared] });
    const second = checkGlossary("en", validGlossary(), { addressForbidden: [shared] });
    expect(second).toEqual(first);
    expect(shared.lastIndex).toBe(0);
  });

  it("TERM_ANCHORS の語が辞書の値から欠けていると失敗が返る", () => {
    mockEnOverride = enWith({ "tool.pageHeading": "Create a code" });
    const failures = checkGlossary("en", validGlossary());
    expect(failures.some((f) => f.includes("tool.pageHeading") && f.includes("QR code"))).toBe(true);
  });

  it("用語集の訳語が辞書の値に入っていないと、アンカーのキーと訳語を示す失敗が返る", () => {
    const glossary = validGlossary();
    glossary.logo = { term: "emblem", forbidden: [] };
    const failures = checkGlossary("en", glossary);
    expect(failures.some((f) => f.includes("decoration.logo.upload") && f.includes("emblem"))).toBe(true);
  });

  it("かな・漢字が辞書の値に混入すると失敗が返る", () => {
    mockEnOverride = enWith({ "header.cta": "Create a QR code ダウンロード" });
    const failures = checkGlossary("en", validGlossary());
    expect(failures.some((f) => f.includes("header.cta") && f.includes("日本語の文字"))).toBe(true);
  });

  it("かな検査の例外キー common.languageSwitch.label は日本語でも失敗しない", () => {
    mockEnOverride = enWith({ "common.languageSwitch.label": "日本語" });
    const failures = checkGlossary("en", validGlossary());
    expect(failures.some((f) => f.includes("common.languageSwitch.label") && f.includes("日本語の文字"))).toBe(false);
  });

  it("かな検査の例外キー以外に日本語を入れると、同じ条件で失敗が出る", () => {
    mockEnOverride = enWith({ "common.languageSwitch.label": "日本語", "header.cta": "Create a QR code 日本語" });
    const failures = checkGlossary("en", validGlossary()).filter((f) => f.includes("日本語の文字"));
    expect(failures.some((f) => f.includes("header.cta"))).toBe(true);
    expect(failures.some((f) => f.includes("common.languageSwitch.label"))).toBe(false);
  });

  describe("記号のそろい（PNG / SVG / PDF / UTM / URL）", () => {
    it("en の値に PDF があり es の値に無いキーは失敗が出る", () => {
      mockEnOverride = enWith({ "header.cta": "Create a QR code PDF" });
      const failures = checkGlossary("es", validGlossary());
      expect(failures.some((f) => f.startsWith("header.cta に PDF が無い"))).toBe(true);
    });

    it("en と es の両方の値に PDF があれば失敗は出ない", () => {
      mockEnOverride = enWith({ "header.cta": "Create a QR code PDF" });
      mockEsOverride = enWith({ "header.cta": "Crear código QR PDF" }, "es");
      const failures = checkGlossary("es", validGlossary());
      expect(failures.some((f) => f.startsWith("header.cta に PDF が無い"))).toBe(false);
    });
  });

  it("ガイドの訳語: utmParameters の訳語が実在しない語だとガイドの失敗が返る", () => {
    const glossary = validGlossary();
    glossary.utmParameters = { term: "zzqx nonexistent", forbidden: [] };
    const failures = checkGlossary("en", glossary);
    expect(failures.some((f) => f.includes("src/content/en/guide/") && f.includes("zzqx nonexistent") && f.includes("(utmParameters)"))).toBe(true);
  });

  describe("一時ディレクトリでの空振り防止・ガイドの文字種", () => {
    let tmp = "";
    beforeEach(() => {
      tmp = fs.mkdtempSync(path.join(os.tmpdir(), "glossary-guide-"));
    });
    afterEach(() => {
      jest.restoreAllMocks();
      fs.rmSync(tmp, { recursive: true, force: true });
    });

    const putGuide = (name: string, body: string) => {
      const dir = path.join(tmp, "src/content/en/guide");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, name), body, "utf-8");
    };

    it("readGuideTexts: ディレクトリが無ければ空、.mdx 以外は無視、frontmatter と本文を連結する", () => {
      expect(readGuideTexts("en", tmp)).toEqual([]);
      putGuide("a.mdx", ["---", "title: T1", "description: D1", "---", "", "Body", ""].join("\n"));
      putGuide("b.txt", "ignored");
      const texts = readGuideTexts("en", tmp);
      expect(texts).toHaveLength(1);
      expect(texts[0].file).toBe("src/content/en/guide/a.mdx");
      expect(texts[0].text).toContain("T1");
      expect(texts[0].text).toContain("D1");
      expect(texts[0].text).toContain("Body");
    });

    it("ガイド MDX が無いと失敗が返る", () => {
      jest.spyOn(process, "cwd").mockReturnValue(tmp);
      const failures = checkGlossary("en", validGlossary());
      expect(failures).toContain("src/content/en/guide に MDX が無い");
    });

    it("ガイド MDX に日本語の文字があると、その行を示す失敗が返る", () => {
      putGuide(
        "x.mdx",
        ["---", "title: QR code", "---", "", "QR code UTM parameters download", "ここは日本語", ""].join("\n")
      );
      jest.spyOn(process, "cwd").mockReturnValue(tmp);
      const failures = checkGlossary("en", validGlossary());
      expect(failures.some((f) => f.includes("src/content/en/guide/x.mdx に日本語の文字がある") && f.includes("ここは日本語"))).toBe(true);
      // 訳語は揃っているので、ガイドの訳語の失敗は出ない
      expect(failures.some((f) => f.includes("x.mdx に訳語"))).toBe(false);
    });

    it("辞書の葉が 0 件だと失敗が返る", () => {
      mockEnOverride = {} as unknown as Dict;
      const failures = checkGlossary("en", validGlossary());
      expect(failures).toContain("辞書の葉が 0 件");
    });
  });

  it("プレースホルダが ja と一致しないと失敗が返る", () => {
    const key = flattenDict(realGetDict("ja")).find((l) => placeholders(l.value).length > 0)?.key;
    expect(key).toBeDefined();
    mockEnOverride = enWith({ [key as string]: "no placeholder here" });
    const failures = checkGlossary("en", validGlossary());
    expect(failures.some((f) => f.includes(key as string) && f.includes("プレースホルダ"))).toBe(true);
  });
});

describe("wordRegExp", () => {
  it("語の前後が文字・数字でなければ一致する", () => {
    const re = wordRegExp("PNG");
    expect(re.test("Download PNG")).toBe(true);
    expect(re.test("PNG, SVG")).toBe(true);
    expect(re.test("(PNG)")).toBe(true);
  });

  it("PNGs や XPNG や PNG2 のように文字・数字が隣接すると一致しない", () => {
    const re = wordRegExp("PNG");
    expect(re.test("PNGs")).toBe(false);
    expect(re.test("XPNG")).toBe(false);
    expect(re.test("PNG2")).toBe(false);
  });

  it("既定では大文字小文字を区別せず、caseSensitive=true で区別する", () => {
    expect(wordRegExp("Sie").test("sie")).toBe(true);
    expect(wordRegExp("Sie", true).test("sie")).toBe(false);
    expect(wordRegExp("Sie", true).test("Sie")).toBe(true);
  });

  it("正規表現の特殊文字を含む語をエスケープする", () => {
    expect(wordRegExp("utm_source").test("add utm_source here")).toBe(true);
    expect(wordRegExp("a.b").test("axb")).toBe(false);
    expect(wordRegExp("a.b").test("a.b")).toBe(true);
  });

  it("アクセント付きの文字も語の一部として扱う", () => {
    expect(wordRegExp("gener").test("generación")).toBe(false);
    expect(wordRegExp("código").test("Su código QR")).toBe(true);
  });

  it("g フラグを持たないので繰り返し test しても結果が変わらない", () => {
    const re = wordRegExp("PNG");
    expect([re.test("PNG"), re.test("PNG"), re.test("PNG")]).toEqual([true, true, true]);
  });
});

describe("TERM_ANCHORS", () => {
  const entries = Object.entries(TERM_ANCHORS).flatMap(([id, keys]) => (keys ?? []).map((key) => ({ id, key })));

  it("キーが 1 件以上ある", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries.map((e) => [e.id, e.key]))("%s のアンカー %s が ja と en の辞書に実在し、値が string", (_id, key) => {
    for (const locale of ["ja", "en"] as const) {
      const leaf = flattenDict(realGetDict(locale)).find((l) => l.key === key);
      expect(leaf).toBeDefined();
      expect(typeof leaf?.value).toBe("string");
    }
  });

  it("TERM_ANCHORS のキー（用語 ID）はすべて TERM_IDS に含まれる", () => {
    for (const id of Object.keys(TERM_ANCHORS)) {
      expect(TERM_IDS).toContain(id);
    }
  });
});

describe("placeholders", () => {
  it("重複を除いて整列する", () => {
    expect(placeholders("{b} {a} {b}")).toEqual(["a", "b"]);
    expect(placeholders("none")).toEqual([]);
  });
});
