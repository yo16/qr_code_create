import fs from "fs";
import path from "path";
import { jaClient } from "@/i18n/jaClient";
import { enClient } from "@/i18n/enClient";

/**
 * 言語切り替えの見た目のガード（qr_code_create-01z.6、38x.9 で旧 .langLink 部分を整理）。
 * 国旗の絵文字・地球アイコンを使わない。designGuard.test.ts と同じく fs で CSS を読む。
 */

const CSS_PATH = path.join(process.cwd(), "src", "components", "layout", "Header", "Header.module.css");
const PICTOGRAPHIC = /\p{Extended_Pictographic}/u;
/** 国旗（Regional Indicator Symbol）。Extended_Pictographic に含まれないので別に見る */
const REGIONAL_INDICATOR = /[\u{1F1E6}-\u{1F1FF}]/u;

function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

describe("デザインガード: 言語切り替え", () => {
  const css = fs.readFileSync(CSS_PATH, "utf-8");

  it("旧 .langLink のスタイルが残っていない", () => {
    expect(stripCssComments(css)).not.toMatch(/\.langLink\b/);
  });

  it("Header.module.css に絵文字・国旗が無い", () => {
    expect(css).not.toMatch(PICTOGRAPHIC);
    expect(css).not.toMatch(REGIONAL_INDICATOR);
  });

  it.each([
    ["ja", jaClient.common.languageSwitch],
    ["en", enClient.common.languageSwitch],
  ] as const)("%s の languageSwitch のラベルに絵文字・国旗が無い", (_name, sw) => {
    for (const text of [sw.buttonLabel, sw.listLabel]) {
      expect(text).not.toMatch(PICTOGRAPHIC);
      expect(text).not.toMatch(REGIONAL_INDICATOR);
    }
  });

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
