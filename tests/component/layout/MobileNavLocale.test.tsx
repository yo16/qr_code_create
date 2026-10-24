import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileNav } from "@/components/layout/Header/MobileNav";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getClientMessages } from "@/i18n/getDict";
import { en } from "@/i18n/en";

/**
 * MobileNav の en 表示（qr_code_create-01z.4）。
 * Client Component なので I18nProvider 経由で英語の文言と locale を受け取る。
 */

// TrackedLink の計測 onClick が <a> に届くよう、onClick を透過させる（MobileNav.test.tsx と同じ）
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

const NAV_ITEMS = [{ href: "/en", label: en.header.nav.home }];
const { mobileMenu } = en.common;

function renderEn() {
  return render(
    <I18nProvider locale="en" messages={getClientMessages("en")}>
      <MobileNav items={NAV_ITEMS} />
    </I18nProvider>
  );
}

describe("MobileNav locale=en", () => {
  beforeEach(() => {
    trackCtaClicked.mockClear();
  });

  // 意図: ハンバーガーの aria-label が開閉に応じて英語になる
  it("aria-label が英語の open / close になる", () => {
    renderEn();
    const button = screen.getByRole("button", { name: mobileMenu.open });
    fireEvent.click(button);
    expect(screen.getByRole("button", { name: mobileMenu.close })).toBeInTheDocument();
  });

  // 意図: CTA が英語の文言で /en/create を指す
  it("CTA が英語で /en/create を指す", () => {
    renderEn();
    fireEvent.click(screen.getByRole("button", { name: mobileMenu.open }));
    const cta = screen.getByRole("link", { name: mobileMenu.cta });
    expect(cta).toHaveAttribute("href", "/en/create");
    expect(screen.queryByRole("link", { name: "QRコード生成" })).toBeNull();
  });

  // 意図: CTA のクリック計測に英語の文言と "mobile_nav" が渡る
  it('CTA クリックで trackCtaClicked(英語文言, "mobile_nav")', () => {
    renderEn();
    fireEvent.click(screen.getByRole("button", { name: mobileMenu.open }));
    fireEvent.click(screen.getByRole("link", { name: mobileMenu.cta }));
    expect(trackCtaClicked).toHaveBeenCalledTimes(1);
    expect(trackCtaClicked).toHaveBeenCalledWith(mobileMenu.cta, "mobile_nav");
  });
});
