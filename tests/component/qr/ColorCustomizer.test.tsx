import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColorCustomizer } from "@/components/qr/DecorationPanel/ColorCustomizer";

jest.mock("@/lib/analytics/events");

describe("ColorCustomizer", () => {
  describe("正常系: 表示確認", () => {
    it("「前景色」ラベルが表示されること", () => {
      render(
        <ColorCustomizer
          fgColor="#000000"
          bgColor="#ffffff"
          onFgColorChange={jest.fn()}
          onBgColorChange={jest.fn()}
        />
      );
      expect(screen.getByText("前景色")).toBeInTheDocument();
    });

    it("「背景色」ラベルが表示されること", () => {
      render(
        <ColorCustomizer
          fgColor="#000000"
          bgColor="#ffffff"
          onFgColorChange={jest.fn()}
          onBgColorChange={jest.fn()}
        />
      );
      expect(screen.getByText("背景色")).toBeInTheDocument();
    });

    it("デフォルト（黒/白）でコントラスト比が「21.00:1」と表示されること", () => {
      render(
        <ColorCustomizer
          fgColor="#000000"
          bgColor="#ffffff"
          onFgColorChange={jest.fn()}
          onBgColorChange={jest.fn()}
        />
      );
      expect(screen.getByText("コントラスト比: 21.00:1")).toBeInTheDocument();
    });

    it("デフォルトで「読み取りやすいコントラストです」メッセージが表示されること", () => {
      render(
        <ColorCustomizer
          fgColor="#000000"
          bgColor="#ffffff"
          onFgColorChange={jest.fn()}
          onBgColorChange={jest.fn()}
        />
      );
      expect(
        screen.getByText("読み取りやすいコントラストです")
      ).toBeInTheDocument();
    });

    it("「デフォルトに戻す」ボタンが表示されること", () => {
      render(
        <ColorCustomizer
          fgColor="#000000"
          bgColor="#ffffff"
          onFgColorChange={jest.fn()}
          onBgColorChange={jest.fn()}
        />
      );
      expect(
        screen.getByRole("button", { name: "デフォルトに戻す" })
      ).toBeInTheDocument();
    });
  });

  describe("コントラスト警告", () => {
    it("コントラスト比3:1未満（fgColor=\"#eeeeee\", bgColor=\"#ffffff\"）でrole=\"alert\"警告が表示されること", () => {
      render(
        <ColorCustomizer
          fgColor="#eeeeee"
          bgColor="#ffffff"
          onFgColorChange={jest.fn()}
          onBgColorChange={jest.fn()}
        />
      );
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByText("QRコードが読み取れない可能性があります")
      ).toBeInTheDocument();
    });

    it("コントラスト比3以上4.5未満で「読み取りにくくなる可能性があります」が表示されること", () => {
      // #777777 on #ffffff はコントラスト比 約4.48:1（3以上4.5未満: caution）
      render(
        <ColorCustomizer
          fgColor="#777777"
          bgColor="#ffffff"
          onFgColorChange={jest.fn()}
          onBgColorChange={jest.fn()}
        />
      );
      expect(
        screen.getByText("読み取りにくくなる可能性があります")
      ).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("操作: デフォルトに戻す", () => {
    it("「デフォルトに戻す」クリックでonFgColorChange(\"#000000\")が呼ばれること", () => {
      const onFgColorChange = jest.fn();
      const onBgColorChange = jest.fn();
      render(
        <ColorCustomizer
          fgColor="#ff0000"
          bgColor="#00ff00"
          onFgColorChange={onFgColorChange}
          onBgColorChange={onBgColorChange}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "デフォルトに戻す" }));
      expect(onFgColorChange).toHaveBeenCalledWith("#000000");
    });

    it("「デフォルトに戻す」クリックでonBgColorChange(\"#ffffff\")が呼ばれること", () => {
      const onFgColorChange = jest.fn();
      const onBgColorChange = jest.fn();
      render(
        <ColorCustomizer
          fgColor="#ff0000"
          bgColor="#00ff00"
          onFgColorChange={onFgColorChange}
          onBgColorChange={onBgColorChange}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "デフォルトに戻す" }));
      expect(onBgColorChange).toHaveBeenCalledWith("#ffffff");
    });
  });
});
