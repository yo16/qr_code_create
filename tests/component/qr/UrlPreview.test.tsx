import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UrlPreview } from "@/components/qr/UrlPreview/UrlPreview";

const defaultProps = {
  url: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmTerm: "",
  utmContent: "",
};

const mockWriteText = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  mockWriteText.mockClear();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: mockWriteText },
    writable: true,
    configurable: true,
  });
});

describe("UrlPreview", () => {
  describe("正常系", () => {
    it("「生成URLプレビュー」ラベルが表示されること", () => {
      render(<UrlPreview {...defaultProps} url="https://example.com" />);
      expect(screen.getByText("生成URLプレビュー")).toBeInTheDocument();
    });

    it("URL入力時にUTMパラメータ付きURLが表示されること", () => {
      render(
        <UrlPreview
          {...defaultProps}
          url="https://example.com"
          utmSource="google"
          utmMedium="cpc"
          utmCampaign="spring"
        />
      );
      const code = screen.getByRole("code");
      expect(code).toHaveTextContent("utm_source=google");
      expect(code).toHaveTextContent("utm_medium=cpc");
      expect(code).toHaveTextContent("utm_campaign=spring");
    });

    it("URL入力時にコピーボタンが表示されること", () => {
      render(<UrlPreview {...defaultProps} url="https://example.com" />);
      expect(
        screen.getByRole("button", { name: "URLをクリップボードにコピー" })
      ).toBeInTheDocument();
    });
  });

  describe("異常系", () => {
    it("URL未入力時にプレースホルダーが表示されること", () => {
      render(<UrlPreview {...defaultProps} />);
      expect(
        screen.getByText("URLを入力するとプレビューが表示されます")
      ).toBeInTheDocument();
    });

    it("URL未入力時にコピーボタンが表示されないこと", () => {
      render(<UrlPreview {...defaultProps} />);
      expect(
        screen.queryByRole("button", { name: "URLをクリップボードにコピー" })
      ).not.toBeInTheDocument();
    });
  });

  describe("コピー機能", () => {
    it("コピーボタンクリックでnavigator.clipboard.writeTextが呼ばれること", async () => {
      render(<UrlPreview {...defaultProps} url="https://example.com" />);
      const button = screen.getByRole("button", {
        name: "URLをクリップボードにコピー",
      });
      fireEvent.click(button);
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledTimes(1);
      });
    });

    it("コピーボタンクリックで生成URLがclipboard.writeTextに渡されること", async () => {
      render(
        <UrlPreview
          {...defaultProps}
          url="https://example.com"
          utmSource="google"
        />
      );
      const button = screen.getByRole("button", {
        name: "URLをクリップボードにコピー",
      });
      fireEvent.click(button);
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          expect.stringContaining("utm_source=google")
        );
      });
    });

    it("コピー後にボタンテキストが「コピーしました」に変わること", async () => {
      const user = userEvent.setup();
      render(<UrlPreview {...defaultProps} url="https://example.com" />);
      const button = screen.getByRole("button", {
        name: "URLをクリップボードにコピー",
      });
      await user.click(button);
      expect(button).toHaveTextContent("コピーしました");
    });

    it("コピー後にaria-live要素で「URLをコピーしました」が通知されること", async () => {
      const user = userEvent.setup();
      render(<UrlPreview {...defaultProps} url="https://example.com" />);
      const button = screen.getByRole("button", {
        name: "URLをクリップボードにコピー",
      });
      await user.click(button);
      const liveRegion = screen.getByRole("status");
      expect(liveRegion).toHaveTextContent("URLをコピーしました");
    });
  });
});
