import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FrameSelector } from "@/components/qr/DecorationPanel/FrameSelector";
import { DEFAULT_FRAME_CONFIG } from "@/lib/qr/frameRenderer";

jest.mock("@/lib/analytics/events");

describe("FrameSelector", () => {
  describe("正常系: 表示確認", () => {
    it("3つのカテゴリラベル（基本/装飾/ターゲット別）が表示されること", () => {
      render(
        <FrameSelector
          frame={DEFAULT_FRAME_CONFIG}
          onChange={jest.fn()}
        />
      );
      // カテゴリは role="group" の aria-label で確認する
      expect(screen.getByRole("group", { name: "基本フレーム" })).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "装飾フレーム" })).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "ターゲット別フレーム" })).toBeInTheDocument();
    });

    it("8つのフレームボタンが表示されること", () => {
      render(
        <FrameSelector
          frame={DEFAULT_FRAME_CONFIG}
          onChange={jest.fn()}
        />
      );
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(8);
    });

    it("初期選択（type=\"none\"）で aria-pressed=\"true\" が1つだけあること", () => {
      render(
        <FrameSelector
          frame={DEFAULT_FRAME_CONFIG}
          onChange={jest.fn()}
        />
      );
      const pressedButtons = screen.getAllByRole("button", { pressed: true });
      expect(pressedButtons).toHaveLength(1);
    });

    it("初期選択（type=\"none\"）の「なし」ボタンが aria-pressed=\"true\" であること", () => {
      render(
        <FrameSelector
          frame={DEFAULT_FRAME_CONFIG}
          onChange={jest.fn()}
        />
      );
      const noneButton = screen.getByRole("button", { name: "フレーム: なし" });
      expect(noneButton).toHaveAttribute("aria-pressed", "true");
    });

    it("type=\"none\" 選択時に ColorPicker が表示されないこと", () => {
      render(
        <FrameSelector
          frame={DEFAULT_FRAME_CONFIG}
          onChange={jest.fn()}
        />
      );
      expect(screen.queryByText("フレームの色")).not.toBeInTheDocument();
    });
  });

  describe("操作: フレームボタンクリック", () => {
    it("「シンプル」ボタンクリックで onChange が type=\"simple\" で呼ばれること", () => {
      const onChange = jest.fn();
      render(
        <FrameSelector
          frame={DEFAULT_FRAME_CONFIG}
          onChange={onChange}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "フレーム: シンプル" }));
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ type: "simple" })
      );
    });

    it("「角丸」ボタンクリックで onChange が type=\"rounded\" で呼ばれること", () => {
      const onChange = jest.fn();
      render(
        <FrameSelector
          frame={DEFAULT_FRAME_CONFIG}
          onChange={onChange}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "フレーム: 角丸" }));
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ type: "rounded" })
      );
    });

    it("ボタンクリックで既存の color が引き継がれること", () => {
      const onChange = jest.fn();
      const frame = { type: "none" as const, color: "#ff0000" };
      render(
        <FrameSelector
          frame={frame}
          onChange={onChange}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "フレーム: シンプル" }));
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ color: "#ff0000" })
      );
    });
  });

  describe("操作: ColorPicker の表示切替", () => {
    it("type=\"simple\" 選択後に「フレームの色」ラベルが表示されること", () => {
      render(
        <FrameSelector
          frame={{ type: "simple", color: "#000000" }}
          onChange={jest.fn()}
        />
      );
      expect(screen.getByText("フレームの色")).toBeInTheDocument();
    });

    it("type=\"none\" に変更すると「フレームの色」ラベルが非表示になること", () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <FrameSelector
          frame={{ type: "simple", color: "#000000" }}
          onChange={onChange}
        />
      );
      expect(screen.getByText("フレームの色")).toBeInTheDocument();

      rerender(
        <FrameSelector
          frame={DEFAULT_FRAME_CONFIG}
          onChange={onChange}
        />
      );
      expect(screen.queryByText("フレームの色")).not.toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("各カテゴリの role=\"group\" に適切な aria-label が設定されていること", () => {
      render(
        <FrameSelector
          frame={DEFAULT_FRAME_CONFIG}
          onChange={jest.fn()}
        />
      );
      expect(screen.getByRole("group", { name: "基本フレーム" })).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "装飾フレーム" })).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "ターゲット別フレーム" })).toBeInTheDocument();
    });
  });
});
