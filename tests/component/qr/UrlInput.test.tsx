import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UrlInput } from "@/components/qr/UrlInput/UrlInput";

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
