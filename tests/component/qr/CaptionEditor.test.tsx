import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CaptionEditor, CaptionConfig } from "@/components/qr/DecorationPanel/CaptionEditor";
import { trackCaptionSet } from "@/lib/analytics/events";

jest.mock("@/lib/analytics/events");

const mockTrackCaptionSet = trackCaptionSet as jest.MockedFunction<typeof trackCaptionSet>;

function CaptionEditorWrapper({ onCaptionChange }: { onCaptionChange?: (c: CaptionConfig) => void }) {
  const [caption, setCaption] = useState<CaptionConfig>({ text: "", fontSize: 14 });
  const handleChange = (c: CaptionConfig) => { setCaption(c); onCaptionChange?.(c); };
  return <CaptionEditor caption={caption} onChange={handleChange} />;
}

describe("CaptionEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("正常系: 表示確認", () => {
    it("テンプレート選択が表示されること（5つのオプション）", () => {
      render(<CaptionEditorWrapper />);
      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
      // 先頭のプレースホルダーオプション + 5つのテンプレート = 計6つ
      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(6);
    });

    it("キャプションテキスト入力が表示されること", () => {
      render(<CaptionEditorWrapper />);
      const input = screen.getByPlaceholderText("キャプションを入力");
      expect(input).toBeInTheDocument();
    });

    it("フォントサイズスライダーが表示されること（min=10, max=24）", () => {
      render(<CaptionEditorWrapper />);
      const slider = screen.getByRole("slider");
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute("min", "10");
      expect(slider).toHaveAttribute("max", "24");
    });

    it("「0/15文字」カウンターが初期表示されること", () => {
      render(<CaptionEditorWrapper />);
      expect(screen.getByText("0/15文字")).toBeInTheDocument();
    });
  });

  describe("操作", () => {
    it("テンプレート選択でテキスト入力に反映されること", () => {
      render(<CaptionEditorWrapper />);
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "スキャンして詳細を見る" } });
      const input = screen.getByPlaceholderText("キャプションを入力") as HTMLInputElement;
      expect(input.value).toBe("スキャンして詳細を見る");
    });

    it("自由入力でテキストが反映されること", () => {
      render(<CaptionEditorWrapper />);
      const input = screen.getByPlaceholderText("キャプションを入力");
      fireEvent.change(input, { target: { value: "テスト入力" } });
      expect((input as HTMLInputElement).value).toBe("テスト入力");
    });

    it("フォントサイズスライダー変更でラベルが更新されること", () => {
      render(<CaptionEditorWrapper />);
      const slider = screen.getByRole("slider");
      fireEvent.change(slider, { target: { value: "20" } });
      expect(screen.getByText("フォントサイズ: 20px")).toBeInTheDocument();
    });
  });

  describe("文字数警告", () => {
    it("15文字以下で警告が表示されないこと", () => {
      render(<CaptionEditorWrapper />);
      const input = screen.getByPlaceholderText("キャプションを入力");
      fireEvent.change(input, { target: { value: "123456789012345" } }); // 15文字
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("16文字以上で警告メッセージが表示されること", () => {
      render(<CaptionEditorWrapper />);
      const input = screen.getByPlaceholderText("キャプションを入力");
      fireEvent.change(input, { target: { value: "1234567890123456" } }); // 16文字
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText("キャプションが長すぎると印刷時に見にくくなります")).toBeInTheDocument();
    });
  });

  describe("GA4", () => {
    it("trackCaptionSetがテンプレート選択時にisTemplate=trueで呼ばれること", () => {
      render(<CaptionEditorWrapper />);
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "スキャンして詳細を見る" } });
      expect(mockTrackCaptionSet).toHaveBeenCalledWith(
        "スキャンして詳細を見る".length,
        true
      );
    });

    it("trackCaptionSetが自由入力時にisTemplate=falseで呼ばれること", () => {
      render(<CaptionEditorWrapper />);
      const input = screen.getByPlaceholderText("キャプションを入力");
      fireEvent.change(input, { target: { value: "自由入力テスト" } });
      expect(mockTrackCaptionSet).toHaveBeenCalledWith(
        "自由入力テスト".length,
        false
      );
    });
  });
});
