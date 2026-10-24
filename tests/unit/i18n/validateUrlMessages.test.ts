import { ja } from "@/i18n/ja";
import { validateUrl } from "@/lib/url/validateUrl";

describe("validateUrl の messages 引数", () => {
  const en = { invalidUrl: "Please enter a valid URL" };

  // 意図: messages を渡すと、そのエラー文が返る（en 版で使う）
  it("messages を渡すとそのエラー文を返す（プロトコル不正）", () => {
    expect(validateUrl("example.com", en)).toEqual({
      isValid: false,
      error: "Please enter a valid URL",
    });
  });

  // 意図: URL コンストラクタで失敗する分岐でも messages が使われる
  it("messages を渡すとそのエラー文を返す（URL 形式不正）", () => {
    expect(validateUrl("https://exam ple.com", en).error).toBe(
      "Please enter a valid URL"
    );
  });

  // 意図: 省略時は ja 辞書の文言（既存の呼び出しが変わらない）
  it("messages 省略時は ja の文言を返す", () => {
    expect(validateUrl("example.com").error).toBe(ja.tool.validation.invalidUrl);
    expect(validateUrl("example.com").error).toBe("有効なURLを入力してください");
  });

  // 意図: 有効な URL・空文字では messages があってもエラーを付けない
  it("有効な URL と空文字ではエラー文を返さない", () => {
    expect(validateUrl("https://example.com", en)).toEqual({ isValid: true });
    expect(validateUrl("", en)).toEqual({ isValid: false });
  });
});
