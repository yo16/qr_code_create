import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import { Tooltip } from "@/components/ui/Tooltip/Tooltip";

describe("Tooltip", () => {
  describe("正常系", () => {
    it("初期状態ではtoolipが非表示であること", () => {
      render(
        <Tooltip content="ツールチップの内容">
          <button>ホバーしてください</button>
        </Tooltip>
      );
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("ホバーでtooltipが表示されること", async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="ツールチップの内容">
          <button>ホバーしてください</button>
        </Tooltip>
      );
      await user.hover(screen.getByText("ホバーしてください"));
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      expect(screen.getByRole("tooltip")).toHaveTextContent(
        "ツールチップの内容"
      );
    });

    it("マウスが離れるとtooltipが非表示になること", async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="ツールチップの内容">
          <button>ホバーしてください</button>
        </Tooltip>
      );
      await user.hover(screen.getByText("ホバーしてください"));
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      await user.unhover(screen.getByText("ホバーしてください"));
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("フォーカスでtooltipが表示されること", () => {
      render(
        <Tooltip content="ツールチップの内容">
          <button>フォーカスしてください</button>
        </Tooltip>
      );
      fireEvent.focus(screen.getByText("フォーカスしてください").closest("span")!);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });
  });

  describe("異常系・エッジケース", () => {
    it("Escキーでtooltipが閉じること", async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="ツールチップの内容">
          <button>ホバーしてください</button>
        </Tooltip>
      );
      await user.hover(screen.getByText("ホバーしてください"));
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("onOpenコールバックがtooltip表示時に呼ばれること", async () => {
      const user = userEvent.setup();
      const handleOpen = jest.fn();
      render(
        <Tooltip content="ツールチップの内容" onOpen={handleOpen}>
          <button>ホバーしてください</button>
        </Tooltip>
      );
      await user.hover(screen.getByText("ホバーしてください"));
      expect(handleOpen).toHaveBeenCalledTimes(1);
    });

    it("blurでツールチップが非表示になること", () => {
      render(
        <Tooltip content="ツールチップの内容">
          <button>フォーカスしてください</button>
        </Tooltip>
      );
      const container = screen
        .getByText("フォーカスしてください")
        .closest("span")!;
      fireEvent.focus(container);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      fireEvent.blur(container);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("position='bottom'を指定すると対応するクラスが付与されること", async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="ツールチップの内容" position="bottom">
          <button>ホバーしてください</button>
        </Tooltip>
      );
      await user.hover(screen.getByText("ホバーしてください"));
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip.className).toMatch(/bottom/);
    });

    it("content=''（空文字）の場合もツールチップ要素が表示されること", async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="">
          <button>ホバーしてください</button>
        </Tooltip>
      );
      await user.hover(screen.getByText("ホバーしてください"));
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      expect(screen.getByRole("tooltip")).toHaveTextContent("");
    });
  });
});
