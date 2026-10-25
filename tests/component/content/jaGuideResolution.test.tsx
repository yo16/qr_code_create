import React from "react";
import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import { ResolutionSelector } from "@/components/qr/DownloadPanel/ResolutionSelector";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getClientMessages } from "@/i18n/getDict";

/**
 * 日本語ガイドの解像度の記述がツールの選択肢と一致すること（qr_code_create-7l1）。
 * 選択肢のラベルは ResolutionSelector を ja で描画して取り出す（ハードコードで二重管理しない）。
 */

const MDX = fs.readFileSync(
  path.join(process.cwd(), "src/content/guide/getting-started.mdx"),
  "utf8"
);

/** 「### 解像度を選ぶ」から次の見出しまで */
const resolutionSection = (() => {
  const m = MDX.match(/^#{2,3} 解像度を選ぶ\s*\n([\s\S]*?)(?=^#{1,3} )/m);
  return m ? m[1] : "";
})();

/** 節の箇条書きの太字ラベル（- **通常**: ... → 通常） */
const bulletLabels = Array.from(resolutionSection.matchAll(/^- \*\*([^*]+)\*\*/gm), (m) => m[1]);

const toolLabels = (): string[] => {
  render(
    <I18nProvider locale="ja" messages={getClientMessages("ja")}>
      <ResolutionSelector value={1} onChange={() => {}} />
    </I18nProvider>
  );
  return screen.getAllByRole("radio").map((el) => el.textContent ?? "");
};

describe("ja ガイドの解像度の節", () => {
  // 意図: 節が見つかる（見出し変更などで空振りしない）
  it("「解像度を選ぶ」の節があり、箇条書きが 1 件以上ある", () => {
    expect(resolutionSection).not.toBe("");
    expect(bulletLabels.length).toBeGreaterThan(0);
  });

  // 意図: ツールの選択肢（ja: 通常 / 2x / 4x）と箇条書きのラベルが同じ並びで一致
  it("箇条書きのラベルが ja の ResolutionSelector の選択肢と一致する", () => {
    const labels = toolLabels();
    expect(labels).toEqual(["通常", "2x", "4x"]);
    expect(bulletLabels).toEqual(labels);
  });

  // 意図: ツールに無い 3x を書かない
  it("節に 3x が無い", () => {
    expect(resolutionSection).not.toMatch(/\b3x\b/i);
  });

  // 意図: 項目数がツールの選択肢数と一致
  it("箇条書きの項目数がツールの選択肢数と一致する", () => {
    expect(bulletLabels).toHaveLength(toolLabels().length);
  });
});
