import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/i18n/I18nProvider";
import { useDict, useLocale } from "@/i18n/useDict";
import { getClientMessages } from "@/i18n/getDict";
import type { ClientDict } from "@/i18n/types";

/** useDict / useLocale の結果を画面に出すだけのプローブ */
function Probe() {
  const dict = useDict();
  const locale = useLocale();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="loading">{dict.common.loading}</span>
      <span data-testid="invalid">{dict.tool.validation.invalidUrl}</span>
    </div>
  );
}

/** ja の Client スライスを深くコピーし、1 キーだけ差し替えた辞書 */
function messagesWithOneChange(): ClientDict {
  const messages = JSON.parse(
    JSON.stringify(getClientMessages("ja"))
  ) as ClientDict;
  messages.common.loading = "Loading";
  return messages;
}

describe("I18nProvider / useDict / useLocale", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  // 意図: Provider が無い既存のコンポーネントテストは ja のまま動く
  it("Provider 無しでは useDict() が ja、useLocale() が ja", () => {
    render(<Probe />);
    expect(screen.getByTestId("locale")).toHaveTextContent("ja");
    expect(screen.getByTestId("loading")).toHaveTextContent("読み込み中");
    expect(screen.getByTestId("invalid")).toHaveTextContent(
      "有効なURLを入力してください"
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  // 意図: Provider に渡した messages と locale がそのまま返る（en ページで使う経路）
  it('locale="en" と messages を渡すとその値が返る', () => {
    render(
      <I18nProvider locale="en" messages={messagesWithOneChange()}>
        <Probe />
      </I18nProvider>
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("loading")).toHaveTextContent("Loading");
    // 差し替えていないキーは渡した messages の値（ja のコピー）のまま
    expect(screen.getByTestId("invalid")).toHaveTextContent(
      "有効なURLを入力してください"
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  // 意図: locale="ja" で messages 省略は正常（ja にフォールバックし、警告しない）
  it('locale="ja" で messages 省略時は ja を返し警告しない', () => {
    render(
      <I18nProvider locale="ja">
        <Probe />
      </I18nProvider>
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("ja");
    expect(screen.getByTestId("loading")).toHaveTextContent("読み込み中");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  // 意図: en なのに messages を渡し忘れたら、開発環境で気付けるよう console.warn を出す（表示は ja に落ちる）
  it('locale="en" で messages 省略時は console.warn を出し ja を返す', () => {
    render(
      <I18nProvider locale="en">
        <Probe />
      </I18nProvider>
    );
    expect(warnSpy).toHaveBeenCalled();
    expect(String(warnSpy.mock.calls[0][0])).toContain("[i18n]");
    expect(String(warnSpy.mock.calls[0][0])).toContain('locale="en"');
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("loading")).toHaveTextContent("読み込み中");
  });
});
