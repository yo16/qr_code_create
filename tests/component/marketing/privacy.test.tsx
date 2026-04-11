import React from "react";
import { render, screen } from "@testing-library/react";
import PrivacyPage from "@/app/(marketing)/privacy/page";

describe("PrivacyPage", () => {
  describe("見出し・日付", () => {
    it("「プライバシーポリシー」見出しが表示されること", () => {
      render(<PrivacyPage />);
      expect(screen.getByRole("heading", { level: 1, name: "プライバシーポリシー" })).toBeInTheDocument();
    });

    it("「最終更新日」が表示されること", () => {
      render(<PrivacyPage />);
      expect(screen.getByText(/最終更新日/)).toBeInTheDocument();
    });
  });

  describe("主要セクション", () => {
    it("「収集する情報」セクションが表示されること", () => {
      render(<PrivacyPage />);
      expect(screen.getByRole("heading", { name: /収集する情報/ })).toBeInTheDocument();
    });

    it("「アクセス解析ツール」セクションが表示されること", () => {
      render(<PrivacyPage />);
      expect(screen.getByRole("heading", { name: /アクセス解析ツール/ })).toBeInTheDocument();
    });

    it("「ロゴ画像のアップロード」セクションが表示されること", () => {
      render(<PrivacyPage />);
      expect(screen.getByRole("heading", { name: /ロゴ画像のアップロード/ })).toBeInTheDocument();
    });

    it("「第三者への情報提供」セクションが表示されること", () => {
      render(<PrivacyPage />);
      expect(screen.getByRole("heading", { name: /第三者への情報提供/ })).toBeInTheDocument();
    });
  });

  describe("ロゴ画像の取り扱い", () => {
    it("ロゴ画像がサーバーにアップロードされない旨が記載されていること", () => {
      render(<PrivacyPage />);
      expect(screen.getByText(/サーバーにアップロードされることはありません/)).toBeInTheDocument();
    });
  });
});
