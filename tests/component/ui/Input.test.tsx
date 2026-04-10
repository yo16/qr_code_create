import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/Input/Input";

describe("Input", () => {
  describe("正常系", () => {
    it("labelとinputが正しく関連付けられていること（htmlFor/id）", () => {
      render(
        <Input label="URL" value="" onChange={jest.fn()} id="test-input" />
      );
      const label = screen.getByText("URL");
      const input = screen.getByRole("textbox");
      expect(label).toHaveAttribute("for", "test-input");
      expect(input).toHaveAttribute("id", "test-input");
    });

    it("helpTextが表示されること", () => {
      render(
        <Input
          label="URL"
          value=""
          onChange={jest.fn()}
          helpText="https://から始まるURLを入力してください"
        />
      );
      expect(
        screen.getByText("https://から始まるURLを入力してください")
      ).toBeInTheDocument();
    });

    it("入力時にonChangeが呼ばれること", async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(<Input label="URL" value="" onChange={handleChange} />);
      await user.type(screen.getByRole("textbox"), "a");
      expect(handleChange).toHaveBeenCalledWith("a");
    });

    it("required時に必須マークが表示されること", () => {
      render(
        <Input label="URL" value="" onChange={jest.fn()} required />
      );
      expect(screen.getByText("*")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toHaveAttribute("required");
    });
  });

  describe("異常系・エッジケース", () => {
    it("error表示時にaria-invalid='true'であること", () => {
      render(
        <Input
          label="URL"
          value=""
          onChange={jest.fn()}
          error="正しいURLを入力してください"
        />
      );
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("error表示時にエラーメッセージがrole='alert'で表示されること", () => {
      render(
        <Input
          label="URL"
          value=""
          onChange={jest.fn()}
          error="正しいURLを入力してください"
        />
      );
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("正しいURLを入力してください");
    });

    it("errorがある場合はhelpTextが表示されないこと", () => {
      render(
        <Input
          label="URL"
          value=""
          onChange={jest.fn()}
          helpText="ヘルプテキスト"
          error="エラーメッセージ"
        />
      );
      expect(screen.queryByText("ヘルプテキスト")).not.toBeInTheDocument();
      expect(screen.getByText("エラーメッセージ")).toBeInTheDocument();
    });
  });

  describe("typeのバリエーション", () => {
    it("type='url'でレンダリングされること", () => {
      render(<Input label="URL" value="" onChange={jest.fn()} type="url" />);
      const input = document.querySelector('input[type="url"]');
      expect(input).toBeInTheDocument();
    });

    it("type='number'でレンダリングされること", () => {
      render(
        <Input label="数値" value="" onChange={jest.fn()} type="number" />
      );
      const input = document.querySelector('input[type="number"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe("aria-describedbyの制御", () => {
    it("helpTextもerrorもない場合にaria-describedbyが付与されないこと", () => {
      render(<Input label="URL" value="" onChange={jest.fn()} />);
      const input = document.querySelector("input")!;
      expect(input).not.toHaveAttribute("aria-describedby");
    });

    it("helpTextがある場合にaria-describedbyがhelpTextのidを指すこと", () => {
      render(
        <Input
          label="URL"
          value=""
          onChange={jest.fn()}
          id="test-aria"
          helpText="ヘルプテキスト"
        />
      );
      const input = screen.getByRole("textbox");
      const helpEl = screen.getByText("ヘルプテキスト");
      const describedBy = input.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      expect(helpEl.id).toBe(describedBy);
    });

    it("errorがある場合にaria-describedbyがerrorのidを指すこと", () => {
      render(
        <Input
          label="URL"
          value=""
          onChange={jest.fn()}
          id="test-aria-error"
          error="エラーメッセージ"
        />
      );
      const input = screen.getByRole("textbox");
      const errorEl = screen.getByRole("alert");
      const describedBy = input.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      expect(errorEl.id).toBe(describedBy);
    });
  });
});
