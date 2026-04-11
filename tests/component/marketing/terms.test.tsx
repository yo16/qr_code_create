import React from "react";
import { render, screen } from "@testing-library/react";
import TermsPage from "@/app/(marketing)/terms/page";

describe("TermsPage", () => {
  describe("見出し・日付", () => {
    it("「利用規約」見出しが表示されること", () => {
      render(<TermsPage />);
      expect(screen.getByRole("heading", { level: 1, name: "利用規約" })).toBeInTheDocument();
    });

    it("「最終更新日」が表示されること", () => {
      render(<TermsPage />);
      expect(screen.getByText(/最終更新日/)).toBeInTheDocument();
    });
  });

  describe("主要条項", () => {
    it("「適用」条項が表示されること", () => {
      render(<TermsPage />);
      expect(screen.getByRole("heading", { name: /適用/ })).toBeInTheDocument();
    });

    it("「利用料金」条項が表示されること", () => {
      render(<TermsPage />);
      expect(screen.getByRole("heading", { name: /利用料金/ })).toBeInTheDocument();
    });

    it("「禁止事項」条項が表示されること", () => {
      render(<TermsPage />);
      expect(screen.getByRole("heading", { name: /禁止事項/ })).toBeInTheDocument();
    });

    it("「免責事項」条項が表示されること", () => {
      render(<TermsPage />);
      expect(screen.getByRole("heading", { name: /免責事項/ })).toBeInTheDocument();
    });
  });

  describe("内容の確認", () => {
    it("「無料」のキーワードが含まれること", () => {
      render(<TermsPage />);
      expect(screen.getByText(/無料/)).toBeInTheDocument();
    });

    it("禁止事項のリスト項目が複数表示されること", () => {
      render(<TermsPage />);
      const listItems = screen.getAllByRole("listitem");
      expect(listItems.length).toBeGreaterThan(1);
    });
  });
});
