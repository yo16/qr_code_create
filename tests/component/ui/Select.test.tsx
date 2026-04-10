import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "@/components/ui/Select/Select";

const defaultOptions = [
  { value: "option1", label: "オプション1" },
  { value: "option2", label: "オプション2" },
  { value: "option3", label: "オプション3" },
];

describe("Select", () => {
  describe("正常系", () => {
    it("optionsが正しく表示されること", () => {
      render(
        <Select
          label="選択肢"
          value=""
          onChange={jest.fn()}
          options={defaultOptions}
        />
      );
      expect(screen.getByText("オプション1")).toBeInTheDocument();
      expect(screen.getByText("オプション2")).toBeInTheDocument();
      expect(screen.getByText("オプション3")).toBeInTheDocument();
    });

    it("選択時にonChangeが呼ばれること", async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(
        <Select
          label="選択肢"
          value=""
          onChange={handleChange}
          options={defaultOptions}
        />
      );
      await user.selectOptions(screen.getByRole("combobox"), "option1");
      expect(handleChange).toHaveBeenCalledWith("option1");
    });

    it("allowCustom=trueで「その他」オプションが表示されること", () => {
      render(
        <Select
          label="選択肢"
          value=""
          onChange={jest.fn()}
          options={defaultOptions}
          allowCustom
        />
      );
      expect(screen.getByText("その他（自由入力）")).toBeInTheDocument();
    });

    it("「その他」選択時に自由入力フィールドが表示されること", async () => {
      const user = userEvent.setup();
      render(
        <Select
          label="選択肢"
          value=""
          onChange={jest.fn()}
          options={defaultOptions}
          allowCustom
        />
      );
      await user.selectOptions(
        screen.getByRole("combobox"),
        "__custom__"
      );
      expect(
        screen.getByRole("textbox", { name: "選択肢（自由入力）" })
      ).toBeInTheDocument();
    });
  });

  describe("異常系・エッジケース", () => {
    it("error表示時にaria-invalid='true'であること", () => {
      render(
        <Select
          label="選択肢"
          value=""
          onChange={jest.fn()}
          options={defaultOptions}
          error="選択してください"
        />
      );
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-invalid",
        "true"
      );
    });

    it("error表示時にエラーメッセージがrole='alert'で表示されること", () => {
      render(
        <Select
          label="選択肢"
          value=""
          onChange={jest.fn()}
          options={defaultOptions}
          error="選択してください"
        />
      );
      expect(screen.getByRole("alert")).toHaveTextContent("選択してください");
    });

    it("allowCustom=falseではその他オプションが表示されないこと", () => {
      render(
        <Select
          label="選択肢"
          value=""
          onChange={jest.fn()}
          options={defaultOptions}
          allowCustom={false}
        />
      );
      expect(screen.queryByText("その他（自由入力）")).not.toBeInTheDocument();
    });
  });

  describe("自由入力フィールドの動作", () => {
    it("自由入力フィールドに文字入力するとonChangeがその値で呼ばれること", async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      render(
        <Select
          label="選択肢"
          value=""
          onChange={handleChange}
          options={defaultOptions}
          allowCustom
        />
      );
      // まず「その他」を選択して自由入力フィールドを表示
      await user.selectOptions(screen.getByRole("combobox"), "__custom__");
      handleChange.mockClear();
      // 自由入力フィールドに文字を入力
      const customInput = screen.getByRole("textbox", {
        name: "選択肢（自由入力）",
      });
      await user.type(customInput, "カスタム値");
      expect(handleChange).toHaveBeenLastCalledWith("カスタム値");
    });

    it("allowCustom=trueかつvalueがoptionsにない値の場合、自由入力フィールドが初期表示されること", () => {
      render(
        <Select
          label="選択肢"
          value="custom-initial-value"
          onChange={jest.fn()}
          options={defaultOptions}
          allowCustom
        />
      );
      expect(
        screen.getByRole("textbox", { name: "選択肢（自由入力）" })
      ).toBeInTheDocument();
    });
  });

  describe("helpTextの表示", () => {
    it("helpTextが表示されること", () => {
      render(
        <Select
          label="選択肢"
          value=""
          onChange={jest.fn()}
          options={defaultOptions}
          helpText="お好みのオプションを選んでください"
        />
      );
      expect(screen.getByText("お好みのオプションを選んでください")).toBeInTheDocument();
    });

    it("helpTextとerrorが両方ある場合、helpTextが非表示になること", () => {
      render(
        <Select
          label="選択肢"
          value=""
          onChange={jest.fn()}
          options={defaultOptions}
          helpText="ヘルプテキスト"
          error="エラーメッセージ"
        />
      );
      expect(screen.queryByText("ヘルプテキスト")).not.toBeInTheDocument();
      expect(screen.getByText("エラーメッセージ")).toBeInTheDocument();
    });
  });

  describe("空のoptionsの場合", () => {
    it("options=[]の場合、プレースホルダーのみ表示されること", () => {
      render(
        <Select
          label="選択肢"
          value=""
          onChange={jest.fn()}
          options={[]}
        />
      );
      const combobox = screen.getByRole("combobox");
      expect(combobox).toBeInTheDocument();
      // 「選択してください」のプレースホルダーのみ存在し、その他optionはない
      const options = combobox.querySelectorAll("option");
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent("選択してください");
    });
  });
});
