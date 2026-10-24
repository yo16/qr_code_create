import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { Header } from "@/components/layout/Header/Header";
import { en } from "@/i18n/en";

/**
 * Header の en 表示（qr_code_create-01z.4）。
 * en は英語版のあるページだけをナビに出し、ロゴと CTA は /en 側を指す。
 */

// TrackedLink の計測 onClick が <a> に届くよう、onClick を透過させる（Header.test.tsx と同じ）
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
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

jest.mock("@/lib/analytics/events", () => ({
  trackCtaClicked: jest.fn(),
}));

const { trackCtaClicked } = jest.requireMock("@/lib/analytics/events") as {
  trackCtaClicked: jest.Mock;
};

// MobileNav は Client（I18nProvider 前提）なので、渡された items だけを描くモックにする
jest.mock("@/components/layout/Header/MobileNav", () => ({
  MobileNav: ({ items }: { items: Array<{ href: string; label: string }> }) => (
    <div data-testid="mobile-nav">
      {items.map((item) => (
        <a key={item.href} href={item.href}>
          {item.label}
        </a>
      ))}
    </div>
  ),
}));

describe("Header locale=en", () => {
  beforeEach(() => {
    trackCtaClicked.mockClear();
  });

  // 意図: ロゴが英語トップ /en を指す
  it("ロゴが /en を指す", () => {
    render(<Header locale="en" />);
    expect(screen.getByRole("link", { name: /QR Code Create/ })).toHaveAttribute("href", "/en");
  });

  // 意図: ナビは英語版のある /en だけで、英語版の無いページへのリンクが無い
  it("ナビは /en だけで /guide /use-cases /blog /faq が無い", () => {
    const { container } = render(<Header locale="en" />);
    const nav = container.querySelector("nav")!;
    const navHrefs = Array.from(nav.querySelectorAll("a"), (a) => a.getAttribute("href"));
    expect(navHrefs).toEqual(["/en", "/en/create"]);
    const mobileHrefs = Array.from(
      within(screen.getByTestId("mobile-nav")).getAllByRole("link"),
      (a) => a.getAttribute("href")
    );
    expect(mobileHrefs).toEqual(["/en"]);
    for (const href of ["/guide", "/use-cases", "/blog", "/faq"]) {
      expect(container.querySelector(`a[href="${href}"]`)).toBeNull();
    }
    expect(within(nav).getByRole("link", { name: en.header.nav.home })).toHaveAttribute("href", "/en");
  });

  // 意図: CTA が英語の文言で /en/create を指し、クリック計測に英語と "header" が渡る
  it('CTA が /en/create を指し、trackCtaClicked(英語文言, "header")', () => {
    const { container } = render(<Header locale="en" />);
    const nav = container.querySelector("nav")!;
    const cta = within(nav).getByRole("link", { name: en.header.cta });
    expect(cta).toHaveAttribute("href", "/en/create");
    fireEvent.click(cta);
    expect(trackCtaClicked).toHaveBeenCalledTimes(1);
    expect(trackCtaClicked).toHaveBeenCalledWith(en.header.cta, "header");
  });
});

describe("Header locale の既定値", () => {
  // 意図: locale 省略時は ja と同じ出力（既存ページの見た目を変えない）
  it('省略と locale="ja" で同じ HTML', () => {
    expect(renderToStaticMarkup(<Header />)).toBe(renderToStaticMarkup(<Header locale="ja" />));
  });
});
