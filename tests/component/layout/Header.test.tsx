import React from "react";
import { render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/Header/Header";

jest.mock("next/link", () => {
  const MockLink = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

jest.mock("@/components/layout/Header/MobileNav", () => ({
  MobileNav: ({ items }: { items: Array<{ href: string; label: string }> }) => (
    <nav data-testid="mobile-nav">
      {items.map((item) => (
        <a key={item.href} href={item.href}>{item.label}</a>
      ))}
    </nav>
  ),
}));

jest.mock("@/components/layout/Container/Container", () => ({
  Container: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("Header", () => {
  describe("ナビゲーションリンク", () => {
    it("「用途別」リンクが表示されること", () => {
      render(<Header />);
      const links = screen.getAllByRole("link", { name: "用途別" });
      expect(links.length).toBeGreaterThan(0);
    });

    it("「用途別」リンクが /use-cases を指していること", () => {
      render(<Header />);
      const links = screen.getAllByRole("link", { name: "用途別" });
      links.forEach((link) => {
        expect(link).toHaveAttribute("href", "/use-cases");
      });
    });

    it("「用途別」リンクが /use-cases/flyer を指していないこと", () => {
      render(<Header />);
      const links = screen.getAllByRole("link", { name: "用途別" });
      links.forEach((link) => {
        expect(link).not.toHaveAttribute("href", "/use-cases/flyer");
      });
    });

    it("「使い方」リンクが /guide を指していること", () => {
      render(<Header />);
      const links = screen.getAllByRole("link", { name: "使い方" });
      expect(links.length).toBeGreaterThan(0);
      links.forEach((link) => {
        expect(link).toHaveAttribute("href", "/guide");
      });
    });

    it("「ブログ」リンクが /blog を指していること", () => {
      render(<Header />);
      const links = screen.getAllByRole("link", { name: "ブログ" });
      expect(links.length).toBeGreaterThan(0);
      links.forEach((link) => {
        expect(link).toHaveAttribute("href", "/blog");
      });
    });

    it("「FAQ」リンクが /faq を指していること", () => {
      render(<Header />);
      const links = screen.getAllByRole("link", { name: "FAQ" });
      expect(links.length).toBeGreaterThan(0);
      links.forEach((link) => {
        expect(link).toHaveAttribute("href", "/faq");
      });
    });
  });

  describe("ロゴ・CTAリンク", () => {
    it("「QR Code Create」ロゴが表示されること", () => {
      render(<Header />);
      expect(screen.getByRole("link", { name: "QR Code Create" })).toBeInTheDocument();
    });

    it("「QRコード生成」CTAリンクが /create を指していること", () => {
      render(<Header />);
      expect(screen.getByRole("link", { name: "QRコード生成" })).toHaveAttribute("href", "/create");
    });
  });
});
