import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import { ColorPicker } from "@/components/ui/ColorPicker/ColorPicker";

describe("ColorPicker", () => {
  describe("正常系", () => {
    it("ラベルが表示されること", () => {
      render(
        <ColorPicker label="前景色" value="#000000" onChange={jest.fn()} />
      );
      expect(screen.getByText("前景色")).toBeInTheDocument();
    });

    it("カラーピッカーで色変更時にonChangeが呼ばれること", () => {
      const handleChange = jest.fn();
      render(
        <ColorPicker label="前景色" value="#000000" onChange={handleChange} />
      );
      const colorInput = screen.getByRole("textbox", {
        name: "前景色のカラーコード",
      });
      // テキストフィールドに新しい色を入力
      fireEvent.change(colorInput, { target: { value: "#ff0000" } });
      expect(handleChange).toHaveBeenCalledWith("#ff0000");
    });

    it("テキスト入力で有効なhex色を入力するとonChangeが呼ばれること", () => {
      const handleChange = jest.fn();
      render(
        <ColorPicker label="前景色" value="#000000" onChange={handleChange} />
      );
      const textInput = screen.getByRole("textbox", {
        name: "前景色のカラーコード",
      });
      fireEvent.change(textInput, { target: { value: "ff0000" } });
      expect(handleChange).toHaveBeenCalledWith("#ff0000");
    });

    it("カラーピッカーのcolor inputにaria-labelが付与されること", () => {
      render(
        <ColorPicker label="背景色" value="#ffffff" onChange={jest.fn()} />
      );
      expect(
        screen.getByLabelText("背景色のカラーピッカー")
      ).toBeInTheDocument();
    });
  });

  describe("異常系・エッジケース", () => {
    it("不正なhex値入力時にはonChangeが呼ばれないこと", () => {
      const handleChange = jest.fn();
      render(
        <ColorPicker label="前景色" value="#000000" onChange={handleChange} />
      );
      const textInput = screen.getByRole("textbox", {
        name: "前景色のカラーコード",
      });
      fireEvent.change(textInput, { target: { value: "not-a-color" } });
      expect(handleChange).not.toHaveBeenCalled();
    });

    it("blurで不正な値が元の値に戻ること", async () => {
      const user = userEvent.setup();
      render(
        <ColorPicker label="前景色" value="#000000" onChange={jest.fn()} id="cp" />
      );
      const textInput = screen.getByRole("textbox", {
        name: "前景色のカラーコード",
      });
      await user.clear(textInput);
      await user.type(textInput, "invalid");
      await user.tab();
      expect(textInput).toHaveValue("#000000");
    });

    it("テキスト入力でblur時に#なしの有効hex値が#付きに正規化されること", async () => {
      const user = userEvent.setup();
      render(
        <ColorPicker label="前景色" value="#000000" onChange={jest.fn()} id="cp2" />
      );
      const textInput = screen.getByRole("textbox", {
        name: "前景色のカラーコード",
      });
      await user.clear(textInput);
      await user.type(textInput, "ff0000");
      await user.tab();
      expect(textInput).toHaveValue("#ff0000");
    });

    it("カラーピッカーで変更したときにテキストフィールドの表示値も変わること", () => {
      render(
        <ColorPicker label="前景色" value="#000000" onChange={jest.fn()} id="cp3" />
      );
      const colorInput = screen.getByLabelText("前景色のカラーピッカー");
      const textInput = screen.getByRole("textbox", {
        name: "前景色のカラーコード",
      });
      fireEvent.change(colorInput, { target: { value: "#123456" } });
      expect(textInput).toHaveValue("#123456");
    });

    it("不正なhex値のvalue propが渡されたときカラーピッカーが#000000にフォールバックされること", () => {
      render(
        <ColorPicker label="前景色" value="invalid" onChange={jest.fn()} />
      );
      const colorInput = screen.getByLabelText("前景色のカラーピッカー");
      expect(colorInput).toHaveValue("#000000");
    });
  });
});
