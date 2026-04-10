import React from "react";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "@/components/ui/ProgressBar/ProgressBar";

describe("ProgressBar", () => {
  describe("正常系", () => {
    it("role='progressbar'が存在すること", () => {
      render(<ProgressBar current={2} total={5} />);
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("aria-valuenow/aria-valuemin/aria-valuemaxが正しいこと", () => {
      render(<ProgressBar current={2} total={5} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "40"); // 2/5 = 40%
      expect(progressbar).toHaveAttribute("aria-valuemin", "0");
      expect(progressbar).toHaveAttribute("aria-valuemax", "100");
    });

    it("デフォルトラベルが表示されること", () => {
      render(<ProgressBar current={2} total={5} />);
      expect(screen.getByText("ステップ 2/5")).toBeInTheDocument();
    });

    it("カスタムlabelが表示されること", () => {
      render(<ProgressBar current={3} total={4} label="ページ 3 / 4" />);
      expect(screen.getByText("ページ 3 / 4")).toBeInTheDocument();
    });

    it("パーセントが正しく表示されること", () => {
      render(<ProgressBar current={1} total={4} />);
      expect(screen.getByText("25%")).toBeInTheDocument();
    });
  });

  describe("異常系・エッジケース", () => {
    it("total=0のとき0%になること", () => {
      render(<ProgressBar current={0} total={0} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "0");
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("current > totalのとき100%を超えないこと", () => {
      render(<ProgressBar current={10} total={5} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "100");
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("current=0のとき0%になること", () => {
      render(<ProgressBar current={0} total={5} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "0");
    });

    it("aria-labelが表示ラベルと一致した正しい値であること", () => {
      render(<ProgressBar current={2} total={5} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-label", "ステップ 2/5");
    });

    it("カスタムlabelのとき、aria-labelがそのlabelであること", () => {
      render(<ProgressBar current={3} total={4} label="ページ 3 / 4" />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-label", "ページ 3 / 4");
    });

    it("currentが負数のとき0%になること", () => {
      render(<ProgressBar current={-1} total={5} />);
      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "0");
      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });

  describe("messageプロパティ", () => {
    it("message未指定時にメッセージ要素が表示されないこと", () => {
      render(<ProgressBar current={2} total={5} />);
      expect(screen.queryByRole("status")).toBeNull();
    });

    it("messageが指定された場合にメッセージテキストが表示されること", () => {
      render(<ProgressBar current={2} total={5} message="あと1ステップで完璧なQRコードに！" />);
      expect(screen.getByText("あと1ステップで完璧なQRコードに！")).toBeInTheDocument();
    });

    it("メッセージ要素にrole=\"status\"が付与されていること", () => {
      render(<ProgressBar current={2} total={5} message="テストメッセージ" />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("メッセージ要素にaria-live=\"polite\"が付与されていること", () => {
      render(<ProgressBar current={2} total={5} message="テストメッセージ" />);
      expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    });
  });
});
