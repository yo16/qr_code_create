import React from "react";
import { render, screen } from "@testing-library/react";
import { CtaSection } from "@/components/top/CtaSection";

describe("CtaSection", () => {
  describe("見出し表示", () => {
    it("セクション見出しが表示されること", () => {
      render(<CtaSection />);
      expect(screen.getByRole("heading", { name: /URLを入れて、4つの手順でダウンロードまで/ })).toBeInTheDocument();
    });
  });

  describe("CTAリンク", () => {
    it("CTAリンクが/createを指していること", () => {
      render(<CtaSection />);
      const createLink = screen.getByRole("link", { name: /無料でQRコードを作成する/ });
      expect(createLink).toBeInTheDocument();
      expect(createLink).toHaveAttribute("href", "/create");
    });
  });
});
