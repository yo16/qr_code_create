import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LogoUploader, LogoConfig } from "@/components/qr/DecorationPanel/LogoUploader";

jest.mock("@/lib/analytics/events");

const mockLogoConfig: LogoConfig = {
  dataUrl: "data:image/png;base64,abc123",
  fileName: "logo.png",
  fileType: "image/png",
  fileSizeKb: 10,
  sizePercent: 20,
};

describe("LogoUploader", () => {
  describe("正常系", () => {
    it("ロゴ未設定時にFileUploadが表示されること", () => {
      render(<LogoUploader logo={null} onChange={jest.fn()} />);
      expect(screen.getByText("ロゴ画像をアップロード")).toBeInTheDocument();
    });

    it("ロゴ設定済み時にサムネイル画像が表示されること", () => {
      render(<LogoUploader logo={mockLogoConfig} onChange={jest.fn()} />);
      const img = screen.getByAltText("ロゴ: logo.png");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "data:image/png;base64,abc123");
    });

    it("ロゴ設定済み時にサイズスライダーが表示されること（min=10, max=25）", () => {
      render(<LogoUploader logo={mockLogoConfig} onChange={jest.fn()} />);
      const slider = screen.getByRole("slider", { name: "ロゴサイズを調整" });
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute("min", "10");
      expect(slider).toHaveAttribute("max", "25");
    });

    it("ロゴ設定済み時に「ロゴを削除」ボタンが表示されること", () => {
      render(<LogoUploader logo={mockLogoConfig} onChange={jest.fn()} />);
      expect(
        screen.getByRole("button", { name: "ロゴを削除" })
      ).toBeInTheDocument();
    });

    it("「ロゴサイズ: 20%」ラベルが表示されること", () => {
      render(<LogoUploader logo={mockLogoConfig} onChange={jest.fn()} />);
      expect(screen.getByText("ロゴサイズ: 20%")).toBeInTheDocument();
    });
  });

  describe("操作系", () => {
    it("スライダー変更でonChangeが新しいsizePercentで呼ばれること", () => {
      const handleChange = jest.fn();
      render(<LogoUploader logo={mockLogoConfig} onChange={handleChange} />);
      const slider = screen.getByRole("slider", { name: "ロゴサイズを調整" });
      fireEvent.change(slider, { target: { value: "25" } });
      expect(handleChange).toHaveBeenCalledWith({
        ...mockLogoConfig,
        sizePercent: 25,
      });
    });

    it("「ロゴを削除」クリックでonChange(null)が呼ばれること", () => {
      const handleChange = jest.fn();
      render(<LogoUploader logo={mockLogoConfig} onChange={handleChange} />);
      const removeButton = screen.getByRole("button", { name: "ロゴを削除" });
      fireEvent.click(removeButton);
      expect(handleChange).toHaveBeenCalledWith(null);
    });
  });

  describe("異常系", () => {
    it("ロゴ未設定時にスライダーが表示されないこと", () => {
      render(<LogoUploader logo={null} onChange={jest.fn()} />);
      expect(
        screen.queryByRole("slider", { name: "ロゴサイズを調整" })
      ).not.toBeInTheDocument();
    });

    it("ロゴ未設定時に削除ボタンが表示されないこと", () => {
      render(<LogoUploader logo={null} onChange={jest.fn()} />);
      expect(
        screen.queryByRole("button", { name: "ロゴを削除" })
      ).not.toBeInTheDocument();
    });
  });

  describe("サイズclamp（読取失敗防止）", () => {
    it("sizePercent=30 を受け取っても表示は25%にclampされること", () => {
      const oversized: LogoConfig = { ...mockLogoConfig, sizePercent: 30 };
      render(<LogoUploader logo={oversized} onChange={jest.fn()} />);
      expect(screen.getByText("ロゴサイズ: 25%")).toBeInTheDocument();
      const slider = screen.getByRole("slider", { name: "ロゴサイズを調整" });
      expect(slider).toHaveAttribute("value", "25");
    });

    it("sizePercent=5 を受け取っても表示は10%にclampされること", () => {
      const undersized: LogoConfig = { ...mockLogoConfig, sizePercent: 5 };
      render(<LogoUploader logo={undersized} onChange={jest.fn()} />);
      expect(screen.getByText("ロゴサイズ: 10%")).toBeInTheDocument();
    });

    it("スライダー操作で上限超えの値が来てもclampしてonChangeが呼ばれること", () => {
      const handleChange = jest.fn();
      render(<LogoUploader logo={mockLogoConfig} onChange={handleChange} />);
      const slider = screen.getByRole("slider", { name: "ロゴサイズを調整" });
      // スライダー自体は max=25 なので通常は超過しないが、防御として clamp 経路を検証
      fireEvent.change(slider, { target: { value: "30" } });
      expect(handleChange).toHaveBeenCalledWith({
        ...mockLogoConfig,
        sizePercent: 25,
      });
    });
  });
});
