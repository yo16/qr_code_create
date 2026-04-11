import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResolutionSelector } from "@/components/qr/DownloadPanel/ResolutionSelector";

describe("ResolutionSelector", () => {
  describe("正常系: 表示確認", () => {
    it("3つの解像度ボタン（通常/2x/4x）が表示されること", () => {
      render(<ResolutionSelector value={1} onChange={jest.fn()} />);
      expect(screen.getByRole("radio", { name: "通常" })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "2x" })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "4x" })).toBeInTheDocument();
    });

    it("role=\"radiogroup\" が存在すること", () => {
      render(<ResolutionSelector value={1} onChange={jest.fn()} />);
      expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    });

    it("デフォルトで「通常」が選択されていること（aria-checked=\"true\"）", () => {
      render(<ResolutionSelector value={1} onChange={jest.fn()} />);
      const normalButton = screen.getByRole("radio", { name: "通常" });
      expect(normalButton).toHaveAttribute("aria-checked", "true");
    });

    it("「通常」選択時に「2x」と「4x」は aria-checked=\"false\" であること", () => {
      render(<ResolutionSelector value={1} onChange={jest.fn()} />);
      expect(screen.getByRole("radio", { name: "2x" })).toHaveAttribute("aria-checked", "false");
      expect(screen.getByRole("radio", { name: "4x" })).toHaveAttribute("aria-checked", "false");
    });

    it("ファイルサイズ目安（約20KB）が表示されること", () => {
      render(<ResolutionSelector value={1} onChange={jest.fn()} />);
      expect(screen.getByText("約20KB")).toBeInTheDocument();
    });
  });

  describe("操作: ボタンクリック", () => {
    it("2xクリックで onChange(2) が呼ばれること", () => {
      const onChange = jest.fn();
      render(<ResolutionSelector value={1} onChange={onChange} />);
      fireEvent.click(screen.getByRole("radio", { name: "2x" }));
      expect(onChange).toHaveBeenCalledWith(2);
    });

    it("4xクリックで onChange(4) が呼ばれること", () => {
      const onChange = jest.fn();
      render(<ResolutionSelector value={1} onChange={onChange} />);
      fireEvent.click(screen.getByRole("radio", { name: "4x" }));
      expect(onChange).toHaveBeenCalledWith(4);
    });

    it("「通常」クリックで onChange(1) が呼ばれること", () => {
      const onChange = jest.fn();
      render(<ResolutionSelector value={2} onChange={onChange} />);
      fireEvent.click(screen.getByRole("radio", { name: "通常" }));
      expect(onChange).toHaveBeenCalledWith(1);
    });
  });

  describe("条件分岐: ヒント・警告の表示", () => {
    it("2x選択時に「印刷向け」テキストが表示されること", () => {
      render(<ResolutionSelector value={2} onChange={jest.fn()} />);
      expect(screen.getByText(/印刷向け/)).toBeInTheDocument();
    });

    it("1x選択時に「印刷向け」テキストが表示されないこと", () => {
      render(<ResolutionSelector value={1} onChange={jest.fn()} />);
      expect(screen.queryByText(/印刷向け/)).not.toBeInTheDocument();
    });

    it("4x選択時に「ファイルサイズが大きくなります」警告が表示されること", () => {
      render(<ResolutionSelector value={4} onChange={jest.fn()} />);
      expect(screen.getByText(/ファイルサイズが大きくなります/)).toBeInTheDocument();
    });

    it("1x選択時に「ファイルサイズが大きくなります」警告が表示されないこと", () => {
      render(<ResolutionSelector value={1} onChange={jest.fn()} />);
      expect(screen.queryByText(/ファイルサイズが大きくなります/)).not.toBeInTheDocument();
    });

    it("2x選択時にファイルサイズ目安（約80KB）が表示されること", () => {
      render(<ResolutionSelector value={2} onChange={jest.fn()} />);
      expect(screen.getByText("約80KB")).toBeInTheDocument();
    });

    it("4x選択時にファイルサイズ目安（約300KB）が表示されること", () => {
      render(<ResolutionSelector value={4} onChange={jest.fn()} />);
      expect(screen.getByText("約300KB")).toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("radiogroup に aria-label \"出力解像度\" が設定されていること", () => {
      render(<ResolutionSelector value={1} onChange={jest.fn()} />);
      expect(screen.getByRole("radiogroup", { name: "出力解像度" })).toBeInTheDocument();
    });
  });
});
