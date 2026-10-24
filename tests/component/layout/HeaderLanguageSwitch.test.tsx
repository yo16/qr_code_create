import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { Header } from "@/components/layout/Header/Header";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getClientMessages } from "@/i18n/getDict";
import { ja } from "@/i18n/ja";
import { en } from "@/i18n/en";
import { usePathname } from "next/navigation";

/**
 * Header に置いた言語切り替えの配置（qr_code_create-01z.6）。
 * 設計: doc/design/i18n-en.md 8.3 節
 * - デスクトップ: desktopNav の右（CTA の後ろ）
 * - モバイル: メニューボタンの左に常に出し、MobileNav のパネル内には置かない
 */

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

// TrackedLink の onClick が <a> に届くよう透過させる（Header.test.tsx と同じ）
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

const mockUsePathname = usePathname as jest.Mock;

function renderJa() {
  return render(<Header />);
}

function renderEn() {
  return render(
    <I18nProvider locale="en" messages={getClientMessages("en")}>
      <Header locale="en" />
    </I18nProvider>
  );
}

/** a が b より DOM 上で前にある */
function isBefore(a: Element, b: Element): boolean {
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

const cases = [
  {
    name: "ja",
    render: renderJa,
    pathname: "/create",
    label: /^EN/,
    href: "/en/create",
    cta: ja.header.cta,
    menuOpen: ja.common.mobileMenu.open,
  },
  {
    name: "en",
    render: renderEn,
    pathname: "/en/create",
    label: /^日本語/,
    href: "/create",
    cta: en.header.cta,
    menuOpen: en.common.mobileMenu.open,
  },
] as const;

describe.each(cases)("Header の言語切り替え（$name）", (c) => {
  beforeEach(() => {
    mockUsePathname.mockReset();
    mockUsePathname.mockReturnValue(c.pathname);
  });

  function getSwitchLinks(container: HTMLElement) {
    return Array.from(container.querySelectorAll("a[hreflang]"));
  }

  // 意図: 切り替えリンクがちょうど 1 つあり、対応ページを指す
  it("切り替えリンクがちょうど 1 つで、対応ページを指す", () => {
    const { container } = c.render();
    const links = getSwitchLinks(container);
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent(c.label);
    expect(links[0]).toHaveAttribute("href", c.href);
  });

  // 意図: 切り替えは desktopNav の外（モバイルで desktopNav が隠れても見える）
  it("切り替えリンクは desktopNav の外にある", () => {
    const { container } = c.render();
    const nav = container.querySelector("nav")!;
    const link = getSwitchLinks(container)[0];
    expect(nav.contains(link)).toBe(false);
  });

  // 意図: DOM 順で CTA → 切り替え → メニューボタン（デスクトップは CTA の右、モバイルはボタンの左）
  it("DOM 順で desktopNav の CTA より後ろ、メニューボタンより前", () => {
    const { container } = c.render();
    const nav = container.querySelector("nav")!;
    const cta = within(nav as HTMLElement).getByRole("link", { name: c.cta });
    const link = getSwitchLinks(container)[0];
    const menuButton = screen.getByRole("button", { name: c.menuOpen });
    expect(isBefore(cta, link)).toBe(true);
    expect(isBefore(link, menuButton)).toBe(true);
  });

  // 意図: 切り替え・desktopNav・MobileNav が同じ actions ラッパーに並ぶ
  it("切り替えは actions ラッパーの中で desktopNav と MobileNav の間にある", () => {
    const { container } = c.render();
    const link = getSwitchLinks(container)[0];
    const actions = link.parentElement!;
    expect(actions).toHaveClass("actions");
    const children = Array.from(actions.children);
    const linkIndex = children.indexOf(link);
    const navIndex = children.findIndex((el) => el.tagName === "NAV");
    const mobileIndex = children.findIndex((el) => el.contains(screen.getByRole("button")));
    expect(navIndex).toBeGreaterThanOrEqual(0);
    expect(navIndex).toBeLessThan(linkIndex);
    expect(linkIndex).toBeLessThan(mobileIndex);
  });

  // 意図: メニューのパネルを開いても、パネル内に切り替えは重ねて置かない
  it("MobileNav のパネルを開いてもパネル内に切り替えリンクが無く、全体でも 1 つのまま", () => {
    const { container } = c.render();
    fireEvent.click(screen.getByRole("button", { name: c.menuOpen }));
    const navs = container.querySelectorAll("nav");
    // desktopNav と開いたパネルの 2 つ
    expect(navs).toHaveLength(2);
    const panel = navs[1];
    expect(panel.querySelector("a[hreflang]")).toBeNull();
    expect(getSwitchLinks(container)).toHaveLength(1);
  });
});
