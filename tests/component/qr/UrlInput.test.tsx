import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UrlInput } from "@/components/qr/UrlInput/UrlInput";
import { trackUrlEntered } from "@/lib/analytics/events";

// GA4 イベント送信をモックし、UrlInput からの呼び出しだけを検証する
// （window.gtag の有無に依存しないようにする）
jest.mock("@/lib/analytics/events", () => ({
  trackUrlEntered: jest.fn(),
}));

const mockTrackUrlEntered = trackUrlEntered as jest.MockedFunction<
  typeof trackUrlEntered
>;

// Controlled wrapper to simulate real usage
function UrlInputWrapper({
  initialValue = "",
  onValidationChange,
}: {
  initialValue?: string;
  onValidationChange?: (isValid: boolean) => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <UrlInput
      value={value}
      onChange={setValue}
      onValidationChange={onValidationChange}
    />
  );
}

describe("UrlInput", () => {
  describe("正常系", () => {
    it("labelが「URL」と表示されること", () => {
      render(<UrlInput value="" onChange={jest.fn()} />);
      expect(
        screen.getByText("URL", { selector: "label" })
      ).toBeInTheDocument();
    });

    it("placeholderが「https://example.com」であること", () => {
      render(<UrlInput value="" onChange={jest.fn()} />);
      const input = document.querySelector('input[type="url"]');
      expect(input).toHaveAttribute("placeholder", "https://example.com");
    });

    it("有効なURL入力時にonChangeが呼ばれること", () => {
      const handleChange = jest.fn();
      render(<UrlInput value="" onChange={handleChange} />);
      const input = document.querySelector('input[type="url"]')!;
      fireEvent.change(input, { target: { value: "https://example.com" } });
      expect(handleChange).toHaveBeenCalledWith("https://example.com");
    });

    it("有効なURL入力時にonValidationChange(true)が呼ばれること", async () => {
      const user = userEvent.setup();
      const handleValidationChange = jest.fn();
      render(
        <UrlInputWrapper onValidationChange={handleValidationChange} />
      );
      const input = document.querySelector('input[type="url"]')!;
      await user.type(input, "https://example.com");
      expect(handleValidationChange).toHaveBeenCalledWith(true);
    });
  });

  describe("異常系", () => {
    it("無効なURL入力時にエラーメッセージが表示されること", () => {
      render(<UrlInput value="" onChange={jest.fn()} />);
      const input = document.querySelector('input[type="url"]')!;
      fireEvent.change(input, { target: { value: "not-a-url" } });
      expect(screen.getByRole("alert")).toHaveTextContent(
        "有効なURLを入力してください"
      );
    });

    it("無効なURL入力時にonValidationChange(false)が呼ばれること", () => {
      const handleValidationChange = jest.fn();
      render(
        <UrlInput
          value=""
          onChange={jest.fn()}
          onValidationChange={handleValidationChange}
        />
      );
      const input = document.querySelector('input[type="url"]')!;
      fireEvent.change(input, { target: { value: "not-a-url" } });
      expect(handleValidationChange).toHaveBeenCalledWith(false);
    });
  });

  describe("空入力（未入力扱い）", () => {
    it("初期表示時にエラーメッセージが表示されないこと", () => {
      render(<UrlInput value="" onChange={jest.fn()} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("無効URL入力後に全消去した場合にエラーメッセージが消えること", async () => {
      const user = userEvent.setup();
      render(<UrlInputWrapper />);
      const input = document.querySelector('input[type="url"]')!;
      await user.type(input, "invalid");
      expect(screen.getByRole("alert")).toBeInTheDocument();
      await user.clear(input);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("onValidationChange省略", () => {
    it("onValidationChangeを渡さずに有効URLを入力してもエラーが発生しないこと", () => {
      render(<UrlInput value="" onChange={jest.fn()} />);
      const input = document.querySelector('input[type="url"]')!;
      expect(() => {
        fireEvent.change(input, {
          target: { value: "https://example.com" },
        });
      }).not.toThrow();
    });
  });

  describe("有効URL入力後の全消去", () => {
    it("有効URL入力後にフィールドを全消去するとonValidationChange(false)が呼ばれること", async () => {
      const user = userEvent.setup();
      const handleValidationChange = jest.fn();
      render(
        <UrlInputWrapper onValidationChange={handleValidationChange} />
      );
      const input = document.querySelector('input[type="url"]')!;
      await user.type(input, "https://example.com");
      expect(handleValidationChange).toHaveBeenCalledWith(true);
      await user.clear(input);
      expect(handleValidationChange).toHaveBeenLastCalledWith(false);
    });
  });

  describe("blurイベント", () => {
    it("有効URL入力状態でblurしてもエラーが表示されないこと", () => {
      render(
        <UrlInput value="https://example.com" onChange={jest.fn()} />
      );
      const input = document.querySelector('input[type="url"]')!;
      fireEvent.focus(input);
      fireEvent.blur(input);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("value propによる初期状態", () => {
    it("外部から有効URLをvalue propとして渡した場合にその値がinputに表示されること", () => {
      render(
        <UrlInput value="https://example.com" onChange={jest.fn()} />
      );
      const input = document.querySelector(
        'input[type="url"]'
      ) as HTMLInputElement;
      expect(input.value).toBe("https://example.com");
    });
  });
});

// 仕様: tmp/bd-body-url-entered.md「期待動作」
// - blur 時に値が有効な URL なら trackUrlEntered(hostname) を呼ぶ
// - 送るのは new URL(value).hostname のみ（パス・クエリ・ポートは含めない）
// - 同じ値で blur を繰り返しても二重送信しない
// - 未入力・無効な URL では送らない
describe("GA4 url_entered イベント（qr_code_create-djg）", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 入力値を変更してからフォーカスを外す操作をまとめたヘルパー。
  // blur は <input> に発火するが、React の onBlur は focusout を扱うため
  // 親 <div onBlur> までバブリングして handleBlur が呼ばれる
  function renderAndGetInput(): HTMLInputElement {
    render(<UrlInputWrapper />);
    return document.querySelector('input[type="url"]') as HTMLInputElement;
  }

  it("有効な URL を入力して blur すると hostname だけを引数に 1 回呼ばれること", () => {
    // パスやクエリを含む URL でも、送る値はドメイン部分（example.com）だけであること
    const input = renderAndGetInput();
    fireEvent.change(input, {
      target: { value: "https://example.com/page?x=1" },
    });
    fireEvent.blur(input);

    expect(mockTrackUrlEntered).toHaveBeenCalledTimes(1);
    expect(mockTrackUrlEntered).toHaveBeenCalledWith("example.com");
  });

  it("ポート番号付き・サブドメイン付きの URL では hostname（ポートなし）を送ること", () => {
    // new URL().hostname はポートを含まない（host とは異なる）。
    // プライバシー方針と他イベントの粒度に合わせてドメインのみ送る
    const input = renderAndGetInput();
    fireEvent.change(input, {
      target: { value: "http://sub.example.co.jp:8080/a" },
    });
    fireEvent.blur(input);

    expect(mockTrackUrlEntered).toHaveBeenCalledTimes(1);
    expect(mockTrackUrlEntered).toHaveBeenCalledWith("sub.example.co.jp");
  });

  it("スキームのない無効な URL を入力して blur しても呼ばれないこと", () => {
    // validateUrl が http(s):// 始まりを要求するため example.com は無効扱い。
    // 無効な値ではイベントを送らない（回帰防止）
    const input = renderAndGetInput();
    fireEvent.change(input, { target: { value: "example.com" } });
    fireEvent.blur(input);

    expect(mockTrackUrlEntered).not.toHaveBeenCalled();
  });

  it("未入力のまま blur しても呼ばれないこと", () => {
    // 空文字は validateUrl で isValid: false なので送らない（回帰防止）
    const input = renderAndGetInput();
    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(mockTrackUrlEntered).not.toHaveBeenCalled();
  });

  it("同じ値のまま blur を 2 回しても 1 回しか呼ばれないこと", () => {
    // 直前に送った値を覚えておき、変わっていなければ二重送信しない
    const input = renderAndGetInput();
    fireEvent.change(input, { target: { value: "https://example.com" } });
    fireEvent.blur(input);
    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(mockTrackUrlEntered).toHaveBeenCalledTimes(1);
    expect(mockTrackUrlEntered).toHaveBeenCalledWith("example.com");
  });

  it("値を変えて blur し直すと再度呼ばれ、引数は変更後のドメインになること", () => {
    // a.example → blur → b.example → blur で 2 回呼ばれ、順に a.example, b.example
    const input = renderAndGetInput();
    fireEvent.change(input, { target: { value: "https://a.example" } });
    fireEvent.blur(input);
    fireEvent.change(input, { target: { value: "https://b.example" } });
    fireEvent.blur(input);

    expect(mockTrackUrlEntered).toHaveBeenCalledTimes(2);
    expect(mockTrackUrlEntered).toHaveBeenNthCalledWith(1, "a.example");
    expect(mockTrackUrlEntered).toHaveBeenNthCalledWith(2, "b.example");
  });
});
