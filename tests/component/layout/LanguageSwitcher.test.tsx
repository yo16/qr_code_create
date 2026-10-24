import React from "react";
import { render, screen } from "@testing-library/react";
import { LanguageSwitcher } from "@/components/layout/Header/LanguageSwitcher";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getClientMessages } from "@/i18n/getDict";
import { usePathname } from "next/navigation";

/**
 * LanguageSwitcher のコンポーネントテスト（qr_code_create-01z.6）。
 * 設計: doc/design/i18n-en.md 8.1 節・10.2 節
 */

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

// next/link が使われたら印が付くようにして、プレーンな <a> であることを確かめる
jest.mock("next/link", () => {
  const MockLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-next-link="true">
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

const mockUsePathname = usePathname as jest.Mock;

function renderJa() {
  return render(<LanguageSwitcher />);
}

function renderEn() {
  return render(
    <I18nProvider locale="en" messages={getClientMessages("en")}>
      <LanguageSwitcher />
    </I18nProvider>
  );
}

beforeEach(() => {
  mockUsePathname.mockReset();
});

describe("LanguageSwitcher（ja のページ、Provider なし）", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/create");
  });

  // 意図: ja のページでは行き先の言語名「EN」を出す
  it("「EN」を表示し、対応する英語ページ /en/create を指す", () => {
    renderJa();
    const link = screen.getByRole("link");
    expect(link).toHaveTextContent(/^EN/);
    expect(link).toHaveAttribute("href", "/en/create");
  });

  // 意図: 行き先の言語を hrefLang と lang で示す
  it('hrefLang="en"、lang="en"', () => {
    renderJa();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("hreflang", "en");
    expect(link).toHaveAttribute("lang", "en");
  });

  // 意図: 読み上げ名に表示文字列「EN」と補足「(English)」を含む
  it("読み上げ名に「EN」と「(English)」を含む", () => {
    renderJa();
    const link = screen.getByRole("link", { name: /EN.*\(English\)/ });
    expect(link).toBeInTheDocument();
  });

  // 意図: 補足は視覚的に隠した span で、言語は英語
  it('hint の span が lang="en" で srOnly クラス', () => {
    const { container } = renderJa();
    const hint = container.querySelector("a > span");
    expect(hint).not.toBeNull();
    expect(hint).toHaveAttribute("lang", "en");
    expect(hint).toHaveClass("srOnly");
    expect(hint).toHaveTextContent("(English)");
  });

  // 意図: 見た目は langLink クラス（ナビリンクと同じ控えめな見た目）
  it("リンクに langLink クラスが付く", () => {
    renderJa();
    expect(screen.getByRole("link")).toHaveClass("langLink");
  });

  // 意図: 英語版の無いページからは英語トップへ
  it("対応ページが無い /faq では /en を指す", () => {
    mockUsePathname.mockReturnValue("/faq");
    renderJa();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/en");
  });

  // 意図: トップとガイドの対応
  it.each([
    ["/", "/en"],
    ["/guide/getting-started", "/en/guide/getting-started"],
  ])("%s では %s を指す", (pathname, expected) => {
    mockUsePathname.mockReturnValue(pathname);
    renderJa();
    expect(screen.getByRole("link")).toHaveAttribute("href", expected);
  });

  // 意図: /en/foo などの未定義 URL は global-not-found（ja のシェル）で描かれる。そのとき「EN」が自分自身を指さず /en を指す
  it("ja のシェルで pathname が /en/foo のとき「EN」は /en を指す（自分自身を指さない）", () => {
    mockUsePathname.mockReturnValue("/en/foo");
    renderJa();
    const link = screen.getByRole("link");
    expect(link).toHaveTextContent(/^EN/);
    expect(link).toHaveAttribute("href", "/en");
    expect(link).not.toHaveAttribute("href", "/en/foo");
  });
});

describe("LanguageSwitcher（en のページ、I18nProvider あり）", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/en/create");
  });

  // 意図: en のページでは行き先の言語名を自言語名「日本語」で出す
  it("「日本語」を表示し、対応する日本語ページ /create を指す", () => {
    renderEn();
    const link = screen.getByRole("link");
    expect(link).toHaveTextContent(/^日本語/);
    expect(link).toHaveAttribute("href", "/create");
  });

  it('hrefLang="ja"、lang="ja"', () => {
    renderEn();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("hreflang", "ja");
    expect(link).toHaveAttribute("lang", "ja");
  });

  // 意図: 読み上げ名に「日本語」と英語の補足「(Japanese)」を含み、補足は lang="en"
  it("読み上げ名に「日本語」と「(Japanese)」を含み、hint は lang=\"en\"", () => {
    const { container } = renderEn();
    expect(screen.getByRole("link", { name: /日本語.*\(Japanese\)/ })).toBeInTheDocument();
    expect(container.querySelector("a > span")).toHaveAttribute("lang", "en");
  });

  it.each([
    ["/en", "/"],
    ["/en/guide/getting-started", "/guide/getting-started"],
  ])("%s では %s を指す", (pathname, expected) => {
    mockUsePathname.mockReturnValue(pathname);
    renderEn();
    expect(screen.getByRole("link")).toHaveAttribute("href", expected);
  });

  // 意図: en に無いページ（404）からは日本語トップへ
  it("対応ページが無い /en/foo では / を指す", () => {
    mockUsePathname.mockReturnValue("/en/foo");
    renderEn();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/");
  });
});

describe("LanguageSwitcher（異常系・境界）", () => {
  // 意図: Router の外などで usePathname が null を返しても落ちず、トップ扱いになる
  it("usePathname が null でも落ちず、ja では /en を指す", () => {
    mockUsePathname.mockReturnValue(null);
    renderJa();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/en");
  });

  it("usePathname が null でも落ちず、en では / を指す", () => {
    mockUsePathname.mockReturnValue(null);
    renderEn();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/");
  });

  // 意図: クエリと hash は引き継がない
  it("pathname にクエリや hash が混ざっていても href に付けない", () => {
    mockUsePathname.mockReturnValue("/create?utm_source=x#top");
    renderJa();
    const href = screen.getByRole("link").getAttribute("href");
    expect(href).toBe("/en/create");
    expect(href).not.toMatch(/[?#]/);
  });

  // 意図: full reload にするため next/link ではなくプレーンな <a>
  it("next/link を使わずプレーンな <a> を描く", () => {
    mockUsePathname.mockReturnValue("/");
    renderJa();
    const link = screen.getByRole("link");
    expect(link.tagName).toBe("A");
    expect(link).not.toHaveAttribute("data-next-link");
  });

  // 意図: リンクはちょうど 1 つ
  it("リンクは 1 つだけ", () => {
    mockUsePathname.mockReturnValue("/");
    renderJa();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
