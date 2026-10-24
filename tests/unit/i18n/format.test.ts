import { formatMessage } from "@/i18n/format";

describe("formatMessage", () => {
  // 意図: 基本の置換。{n} が数値で埋まること
  it("{n} を params の値で置換する", () => {
    expect(formatMessage("約{n}KB", { n: 12 })).toBe("約12KB");
  });

  // 意図: 複数キーをそれぞれ正しく埋め、同じキーの複数出現もすべて埋まること
  it("複数キーと同じキーの繰り返しを置換する", () => {
    expect(
      formatMessage("ステップ {current}/{total}（{current}）", {
        current: 2,
        total: 4,
      })
    ).toBe("ステップ 2/4（2）");
  });

  // 意図: params に無いキーは落とさず、そのまま残す（翻訳漏れを画面で気付けるように）
  it("未知のキーのプレースホルダはそのまま残す", () => {
    expect(formatMessage("{label}のヘルプ {unknown}", { label: "A" })).toBe(
      "Aのヘルプ {unknown}"
    );
  });

  // 意図: params 省略時もプレースホルダを壊さない
  it("params 省略時はテンプレートをそのまま返す", () => {
    expect(formatMessage("ロゴ: {fileName}")).toBe("ロゴ: {fileName}");
  });

  // 意図: String.prototype.replace の置換パターン（$& $1 $$ $` $'）が値に入っても解釈されないこと
  it("値に含まれる $& $1 $$ などの特殊文字を解釈しない", () => {
    expect(formatMessage("[{v}]", { v: "$&" })).toBe("[$&]");
    expect(formatMessage("[{v}]", { v: "$1$$" })).toBe("[$1$$]");
    expect(formatMessage("[{v}]", { v: "$`$'" })).toBe("[$`$']");
  });

  // 意図: 値にプレースホルダ形式の文字列が入っても再帰的に展開しないこと
  it("値に含まれる {key} 形式は再展開しない", () => {
    expect(formatMessage("{a}{b}", { a: "{b}", b: "X" })).toBe("{b}X");
  });

  // 意図: プレースホルダが無い文言は一字一句そのまま返す
  it("プレースホルダが無い文字列はそのまま返す", () => {
    expect(formatMessage("QRコードが完成しました！", { n: 1 })).toBe(
      "QRコードが完成しました！"
    );
  });

  // 意図: 0 や空文字の値も正しく埋まる（falsy で既定値に落ちない）
  it("0 や空文字の値も置換する", () => {
    expect(formatMessage("{n}件{s}", { n: 0, s: "" })).toBe("0件");
  });

  // 意図: Object.prototype のプロパティ名（toString 等）を params にあると誤認しない
  it("プロトタイプ上のキー名はプレースホルダのまま残す", () => {
    expect(formatMessage("{toString}", {})).toBe("{toString}");
  });
});
