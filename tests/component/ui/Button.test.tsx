import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button/Button";

describe("Button", () => {
  describe("正常系", () => {
    it("デフォルトでprimaryボタンとしてレンダリングされること", () => {
      render(<Button>送信</Button>);
      const button = screen.getByRole("button", { name: "送信" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("type", "button");
    });

    it("childrenがボタンテキストとして表示されること", () => {
      render(<Button>クリックしてください</Button>);
      expect(screen.getByText("クリックしてください")).toBeInTheDocument();
    });

    it("onClickが呼ばれること", async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>送信</Button>);
      await user.click(screen.getByRole("button", { name: "送信" }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("type='submit'が設定されること", () => {
      render(<Button type="submit">送信</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });
  });

  describe("異常系・エッジケース", () => {
    it("disabled時にクリックが無効であること", async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(
        <Button disabled onClick={handleClick}>
          送信
        </Button>
      );
      const button = screen.getByRole("button", { name: "送信" });
      expect(button).toBeDisabled();
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("onClickが未指定でもクリックしてもエラーにならないこと", async () => {
      const user = userEvent.setup();
      render(<Button>送信</Button>);
      await expect(
        user.click(screen.getByRole("button"))
      ).resolves.not.toThrow();
    });
  });

  describe("variant/sizeのバリエーション", () => {
    it("variant='secondary'でレンダリングされること", () => {
      render(<Button variant="secondary">送信</Button>);
      const button = screen.getByRole("button", { name: "送信" });
      expect(button).toBeInTheDocument();
    });

    it("variant='ghost'でレンダリングされること", () => {
      render(<Button variant="ghost">送信</Button>);
      const button = screen.getByRole("button", { name: "送信" });
      expect(button).toBeInTheDocument();
    });

    it("size='sm'でレンダリングされること", () => {
      render(<Button size="sm">送信</Button>);
      const button = screen.getByRole("button", { name: "送信" });
      expect(button).toBeInTheDocument();
    });

    it("size='lg'でレンダリングされること", () => {
      render(<Button size="lg">送信</Button>);
      const button = screen.getByRole("button", { name: "送信" });
      expect(button).toBeInTheDocument();
    });

    it("classNameがbutton要素に追加されること", () => {
      render(<Button className="my-custom-class">送信</Button>);
      const button = screen.getByRole("button", { name: "送信" });
      expect(button.className).toContain("my-custom-class");
    });
  });
});
