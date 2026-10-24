import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "@/components/layout/Header/Header";
import { BrandMark } from "@/components/layout/Header/BrandMark";

// TrackedLink も next/link を import するためこのモックが効く。計測の onClick が <a> に届くよう onClick を透過させる
jest.mock("next/link", () => {
  const MockLink = ({
    href,
    children,
    className,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  }) => (
    <a href={href} className={className} onClick={onClick}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

// CTA クリック計測（qr_code_create-pa6）: TrackedLink が呼ぶ trackCtaClicked をモックする
jest.mock("@/lib/analytics/events", () => ({
  trackCtaClicked: jest.fn(),
}));

const { trackCtaClicked } = jest.requireMock("@/lib/analytics/events") as {
  trackCtaClicked: jest.Mock;
};

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

  // CTA クリック計測（qr_code_create-pa6）: デスクトップナビの「QRコード生成」は TrackedLink 経由で location="header" を送る
  // （MobileNav はこのファイルではモックしているため、モバイルメニュー側は MobileNav.test.tsx で検証する）
  describe("CTA クリック計測", () => {
    beforeEach(() => {
      trackCtaClicked.mockClear();
    });

    it("「QRコード生成」をクリックすると trackCtaClicked(\"QRコード生成\", \"header\") が 1 回呼ばれること", () => {
      // 意図: Header は Server Component のままで、client の TrackedLink だけが計測を担う。children の文言が button_text になること
      render(<Header />);
      fireEvent.click(screen.getByRole("link", { name: "QRコード生成" }));
      expect(trackCtaClicked).toHaveBeenCalledTimes(1);
      expect(trackCtaClicked).toHaveBeenCalledWith("QRコード生成", "header");
    });

    it("ロゴや通常のナビゲーションリンクをクリックしても trackCtaClicked が呼ばれないこと", () => {
      // 意図: CTA 以外のリンク（素の Link）のクリックが cta_clicked に混ざらないこと
      render(<Header />);
      fireEvent.click(screen.getByRole("link", { name: "QR Code Create" }));
      fireEvent.click(screen.getAllByRole("link", { name: "使い方" })[0]);
      expect(trackCtaClicked).not.toHaveBeenCalled();
    });
  });

  // サービスマーク（qr_code_create-9zf）: ロゴリンクの中にマークが入り、
  // 文字「QR Code Create」とリンク先 / は変わらないことを確認する
  describe("ブランドマーク", () => {
    it("ロゴリンクの中に装飾用の svg があり、aria-hidden=true と focusable=false を持つこと", () => {
      render(<Header />);
      const logo = screen.getByRole("link", { name: "QR Code Create" });
      const svg = logo.querySelector("svg");
      // マークは文字の飾りなので支援技術からは隠し、IE/旧 Edge でフォーカスを受けないようにする
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
    });

    it("マークを足してもロゴリンクのアクセシブルネームが「QR Code Create」のままで、/ を指すこと", () => {
      render(<Header />);
      // getByRole の name は完全一致なので、svg 由来の余計な文字が名前に混ざれば失敗する
      const logo = screen.getByRole("link", { name: "QR Code Create" });
      expect(logo).toHaveAccessibleName("QR Code Create");
      expect(logo).toHaveAttribute("href", "/");
    });
  });
});

describe("BrandMark", () => {
  it("className が svg 要素に付くこと（Header.module.css の .mark でサイズと色を当てるため）", () => {
    const { container } = render(<BrandMark className="brand-mark-test" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveClass("brand-mark-test");
  });

  it("fill が currentColor で、色を CSS の color で決められること", () => {
    const { container } = render(<BrandMark />);
    expect(container.querySelector("svg")).toHaveAttribute("fill", "currentColor");
  });

  it("viewBox が 0 0 32 32（public/brand/mark.svg と同じ座標系）であること", () => {
    const { container } = render(<BrandMark />);
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", "0 0 32 32");
  });

  it("単体でも aria-hidden=true と focusable=false を持ち、path を 1 つ以上含むこと", () => {
    const { container } = render(<BrandMark />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg?.querySelectorAll("path").length).toBeGreaterThan(0);
  });
});
