import fs from "fs";
import path from "path";
import { jaClient } from "@/i18n/jaClient";
import { enClient } from "@/i18n/enClient";

/**
 * 言語切り替え（.langLink）の見た目のガード（qr_code_create-01z.6）。
 * 設計: doc/design/i18n-en.md 8.1 節。pill・枠・国旗の絵文字・地球アイコンを使わず、
 * 既存の navLink と同じく色と下線の変化だけにする。designGuard.test.ts と同じく fs で CSS を読む。
 */

const CSS_PATH = path.join(process.cwd(), "src", "components", "layout", "Header", "Header.module.css");
const PICTOGRAPHIC = /\p{Extended_Pictographic}/u;
/** 国旗（Regional Indicator Symbol）。Extended_Pictographic に含まれないので別に見る */
const REGIONAL_INDICATOR = /[\u{1F1E6}-\u{1F1FF}]/u;

function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** セレクタに .langLink を含むブロックを列挙する（入れ子の @media 内も内側だけを取る） */
function extractLangLinkBlocks(css: string): { selector: string; body: string }[] {
  const blocks: { selector: string; body: string }[] = [];
  const re = /([^{}]*)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripCssComments(css))) !== null) {
    if (/\.langLink\b/.test(m[1])) blocks.push({ selector: m[1].trim(), body: m[2] });
  }
  return blocks;
}

describe("デザインガード: 言語切り替え .langLink", () => {
  const css = fs.readFileSync(CSS_PATH, "utf-8");
  const blocks = extractLangLinkBlocks(css);

  // 空振り防止
  it(".langLink のブロックが存在する（本体と :hover）", () => {
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    expect(blocks.some((b) => /\.langLink\s*$/.test(b.selector) || /\.langLink\s*,/.test(b.selector))).toBe(true);
    expect(blocks.some((b) => b.selector.includes(".langLink:hover"))).toBe(true);
  });

  // 意図: pill や枠に見える指定（border / background / border-radius / box-shadow / outline）を置かない
  it.each(["border", "background", "border-radius", "box-shadow", "outline"])(
    ".langLink 系のブロックに %s 系の指定が無い",
    (prop) => {
      const re = new RegExp(`(^|[;\\s])${prop}(-[a-z-]+)?\\s*:`);
      const violations = blocks.filter((b) => re.test(b.body)).map((b) => b.selector);
      expect(violations).toEqual([]);
    }
  );

  // 意図: 大文字化などの装飾をしない（「EN」は辞書の文字列そのまま）
  it(".langLink 系のブロックに text-transform が無い", () => {
    const violations = blocks.filter((b) => /text-transform\s*:/.test(b.body)).map((b) => b.selector);
    expect(violations).toEqual([]);
  });

  // 意図: 擬似要素で地球アイコンや国旗を足さない
  it(".langLink の ::before / ::after が無い", () => {
    expect(blocks.filter((b) => /::?(before|after)/.test(b.selector))).toEqual([]);
  });

  // 意図: ホバーは navLink と同じ色と下線の変化だけ
  it(".langLink:hover は .navLink:hover と同じブロックで color と text-decoration だけ", () => {
    const hover = blocks.find((b) => b.selector.includes(".langLink:hover"))!;
    expect(hover.selector).toContain(".navLink:hover");
    const props = hover.body
      .split(";")
      .map((d) => d.split(":")[0].trim())
      .filter(Boolean)
      .sort();
    expect(props).toEqual(["color", "text-decoration"]);
  });

  // 意図: CSS に絵文字・国旗が無い
  it("Header.module.css に絵文字・国旗が無い", () => {
    expect(css).not.toMatch(PICTOGRAPHIC);
    expect(css).not.toMatch(REGIONAL_INDICATOR);
  });

  // 意図: 切り替えラベルにも絵文字・国旗が無い
  it.each([
    ["ja", jaClient.common.languageSwitch],
    ["en", enClient.common.languageSwitch],
  ] as const)("%s の languageSwitch の label / hint に絵文字・国旗が無い", (_name, sw) => {
    for (const text of [sw.label, sw.hint]) {
      expect(text).not.toMatch(PICTOGRAPHIC);
      expect(text).not.toMatch(REGIONAL_INDICATOR);
    }
  });

  // 意図: 視覚的に隠す .srOnly が定義されている（hint を読み上げだけに出すため）
  it(".srOnly が clip と 1px で視覚的に隠す定義になっている", () => {
    const m = stripCssComments(css).match(/\.srOnly\s*\{([^{}]*)\}/);
    expect(m).not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/position\s*:\s*absolute/);
    expect(body).toMatch(/width\s*:\s*1px/);
    expect(body).toMatch(/height\s*:\s*1px/);
    expect(body).toMatch(/overflow\s*:\s*hidden/);
  });
});
