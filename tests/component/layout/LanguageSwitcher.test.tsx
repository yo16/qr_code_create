import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageSwitcher } from "@/components/layout/Header/LanguageSwitcher";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getClientMessages } from "@/i18n/getDict";
import { usePathname } from "next/navigation";

/**
 * LanguageSwitcher のコンポーネントテスト（qr_code_create-01z.6）。
 * 設計: doc/design/i18n-multi.md 8 節（disclosure に作り直し。M5 で最小限に書き直し、網羅はテスト工程で足す）
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

function renderLocale(locale: "es" | "pt-br" | "de") {
  return render(
    <I18nProvider locale={locale} messages={getClientMessages(locale)}>
      <LanguageSwitcher />
    </I18nProvider>
  );
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

describe("LanguageSwitcher（disclosure の基本）", () => {
  it("ja: ボタンの見える文字は日本語、読み上げ名は辞書の buttonLabel、閉じている", () => {
    mockUsePathname.mockReturnValue("/create");
    renderJa();
    const button = screen.getByRole("button", { name: /言語（Language）/ });
    expect(button).toHaveTextContent("日本語");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("開くと 5 言語のリンクが自称で並び、今の言語に aria-current、各リンクに lang", () => {
    mockUsePathname.mockReturnValue("/create");
    renderJa();
    fireEvent.click(screen.getByRole("button"));
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual(["日本語", "English", "Español", "Português (Brasil)", "Deutsch"]);
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/create", "/en/create", "/es/create", "/pt-br/create", "/de/create"]);
    expect(links.map((a) => a.getAttribute("lang"))).toEqual(["ja", "en", "es", "pt-BR", "de"]);
    expect(links[0]).toHaveAttribute("aria-current", "true");
    expect(links[1]).not.toHaveAttribute("aria-current");
  });

  it("en: ボタンは English、今の言語は English", () => {
    mockUsePathname.mockReturnValue("/en/create");
    renderEn();
    const button = screen.getByRole("button", { name: /Language/ });
    expect(button).toHaveTextContent("English");
    fireEvent.click(button);
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "日本語" })).toHaveAttribute("href", "/create");
  });

  it("対応ページが無い /faq では ja 以外はトップを指す", () => {
    mockUsePathname.mockReturnValue("/faq");
    renderJa();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("link", { name: "Deutsch" })).toHaveAttribute("href", "/de");
  });

  it("Esc で閉じてボタンへフォーカスが戻る", () => {
    mockUsePathname.mockReturnValue("/");
    renderJa();
    const button = screen.getByRole("button");
    fireEvent.click(button);
    screen.getByRole("link", { name: "English" }).focus();
    fireEvent.keyDown(screen.getByRole("link", { name: "English" }), { key: "Escape" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("外側の pointerdown で閉じる", () => {
    mockUsePathname.mockReturnValue("/");
    renderJa();
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.pointerDown(document.body);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("usePathname が null でも落ちない", () => {
    mockUsePathname.mockReturnValue(null);
    renderJa();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("href", "/en");
  });

  it("next/link ではなくプレーンな <a>", () => {
    mockUsePathname.mockReturnValue("/");
    renderJa();
    fireEvent.click(screen.getByRole("button"));
    for (const a of screen.getAllByRole("link")) expect(a).not.toHaveAttribute("data-next-link");
  });
});

const ALL_LANGS = ["ja", "en", "es", "pt-BR", "de"];

describe("LanguageSwitcher: 5 言語のリンク（href / hrefLang / lang）", () => {
  const cases = [
    { name: "ja", render: renderJa, pathname: "/guide/getting-started", hrefs: ["/guide/getting-started", "/en/guide/getting-started", "/es/guide/getting-started", "/pt-br/guide/getting-started", "/de/guide/getting-started"] },
    { name: "en", render: renderEn, pathname: "/en/create", hrefs: ["/create", "/en/create", "/es/create", "/pt-br/create", "/de/create"] },
    { name: "es", render: () => renderLocale("es"), pathname: "/es", hrefs: ["/", "/en", "/es", "/pt-br", "/de"] },
  ];

  it.each(cases)("$name のページ（$pathname）から 5 言語すべての href・hrefLang・lang が正しい", ({ render: r, pathname, hrefs }) => {
    mockUsePathname.mockReturnValue(pathname);
    r();
    fireEvent.click(screen.getByRole("button"));
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(hrefs);
    expect(links.map((a) => a.getAttribute("hrefLang"))).toEqual(ALL_LANGS);
    expect(links.map((a) => a.getAttribute("lang"))).toEqual(ALL_LANGS);
  });

  it("es のページでは es のリンクだけに aria-current が付く", () => {
    mockUsePathname.mockReturnValue("/es/create");
    renderLocale("es");
    fireEvent.click(screen.getByRole("button"));
    const current = screen.getAllByRole("link").filter((a) => a.hasAttribute("aria-current"));
    expect(current.map((a) => a.textContent)).toEqual(["Español"]);
  });

  it("pt-br のページでは pt-BR のリンクに aria-current、ボタンは短い名前", () => {
    mockUsePathname.mockReturnValue("/pt-br/create");
    renderLocale("pt-br");
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Português");
    fireEvent.click(button);
    expect(screen.getByRole("link", { name: "Português (Brasil)" })).toHaveAttribute("aria-current", "true");
  });
});

describe("LanguageSwitcher: 行き先の例外", () => {
  // 意図: global-not-found は ja のシェルで接頭辞配下の未定義 URL を描く。自分自身を指さない
  it("ja のシェルで /en/foo を描くとき、どのリンクも /en/foo を指さず ja は / を指す", () => {
    mockUsePathname.mockReturnValue("/en/foo");
    renderJa();
    fireEvent.click(screen.getByRole("button"));
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).not.toContain("/en/foo");
    expect(hrefs).toEqual(["/", "/en", "/es", "/pt-br", "/de"]);
  });

  it("ja のシェルで /es/foo を描くとき、自分自身を指さない", () => {
    mockUsePathname.mockReturnValue("/es/foo");
    renderJa();
    fireEvent.click(screen.getByRole("button"));
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).not.toContain("/es/foo");
  });

  // 意図: クエリと hash は引き継がない
  it.each(["/create?utm_source=x", "/create#top", "/create?a=1#b"])("pathname が %s でも href にクエリ・hash が付かない", (pathname) => {
    mockUsePathname.mockReturnValue(pathname);
    renderJa();
    fireEvent.click(screen.getByRole("button"));
    for (const a of screen.getAllByRole("link")) {
      expect(a.getAttribute("href")).not.toMatch(/[?#]/);
    }
    expect(screen.getByRole("link", { name: "Español" })).toHaveAttribute("href", "/es/create");
  });
});

describe("LanguageSwitcher: 開閉の操作", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/create");
  });

  it("ボタンの再クリックで閉じる", () => {
    renderJa();
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("フォーカスが外へ出たら閉じる（relatedTarget が外の要素）", () => {
    render(
      <div>
        <LanguageSwitcher />
        <button type="button">外のボタン</button>
      </div>
    );
    const button = screen.getByRole("button", { name: /言語（Language）/ });
    fireEvent.click(button);
    fireEvent.focusOut(screen.getByRole("link", { name: "English" }), {
      relatedTarget: screen.getByRole("button", { name: "外のボタン" }),
    });
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  // 意図: relatedTarget が null（ウィンドウ外・クリックでの一時的な blur）では閉じない
  it("relatedTarget が null の blur では閉じない", () => {
    renderJa();
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.focusOut(button, { relatedTarget: null });
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  // 回帰: 一覧の中への移動や操作で閉じてはいけない
  it("ボタンから一覧内のリンクへフォーカスが移っても閉じない", () => {
    renderJa();
    const button = screen.getByRole("button");
    fireEvent.click(button);
    const link = screen.getByRole("link", { name: "English" });
    fireEvent.focusOut(button, { relatedTarget: link });
    link.focus();
    expect(link).toHaveFocus();
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("一覧内のリンク同士のフォーカス移動でも閉じない", () => {
    renderJa();
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.focusOut(screen.getByRole("link", { name: "English" }), {
      relatedTarget: screen.getByRole("link", { name: "Español" }),
    });
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("一覧内のリンクへの pointerdown では閉じない", () => {
    renderJa();
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.pointerDown(screen.getByRole("link", { name: "Deutsch" }));
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("ボタンへの pointerdown では閉じない（click で切り替わるため）", () => {
    renderJa();
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.pointerDown(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("開いていてボタンにフォーカスがあるときの Esc で閉じ、フォーカスはボタンのまま", () => {
    renderJa();
    const button = screen.getByRole("button");
    button.focus();
    fireEvent.click(button);
    fireEvent.keyDown(button, { key: "Escape" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it.each([
    ["ja", "/", "日本語", renderJa],
    ["en", "/en", "English", renderEn],
    ["es", "/es", "Español", () => renderLocale("es")],
    ["pt-br", "/pt-br", "Português (Brasil)", () => renderLocale("pt-br")],
    ["de", "/de", "Deutsch", () => renderLocale("de")],
  ] as const)("%s のページでは %s の言語（%s）のリンクだけに aria-current", (_n, pathname, name, r) => {
    mockUsePathname.mockReturnValue(pathname);
    r();
    fireEvent.click(screen.getByRole("button"));
    const current = screen.getAllByRole("link").filter((a) => a.hasAttribute("aria-current"));
    expect(current.map((a) => a.textContent)).toEqual([name]);
  });

  it("閉じているときの Esc は何もしない（フォーカスも奪わない）", () => {
    renderJa();
    const button = screen.getByRole("button");
    fireEvent.keyDown(button, { key: "Escape" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).not.toHaveFocus();
  });

  it("Esc 以外のキーでは閉じない", () => {
    renderJa();
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.keyDown(button, { key: "a" });
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("開いても、フォーカスはボタンにあるまま移らない", () => {
    renderJa();
    const button = screen.getByRole("button");
    button.focus();
    fireEvent.click(button);
    expect(button).toHaveFocus();
  });
});

describe("LanguageSwitcher: 読み上げ名と関連付け", () => {
  it("ja: 読み上げ名は「言語（Language）: 日本語」", () => {
    mockUsePathname.mockReturnValue("/");
    renderJa();
    expect(screen.getByRole("button")).toHaveAccessibleName("言語（Language）: 日本語");
  });

  it("en: 読み上げ名は「Language: English」", () => {
    mockUsePathname.mockReturnValue("/en");
    renderEn();
    expect(screen.getByRole("button")).toHaveAccessibleName("Language: English");
  });

  it("ボタンの見える文字の言語は現在の言語の lang で包まれる", () => {
    mockUsePathname.mockReturnValue("/en");
    renderEn();
    expect(screen.getByText("English", { selector: "button span" })).toHaveAttribute("lang", "en");
  });

  it("aria-controls と ul の id が一致し、ul に一覧の名前が付く", () => {
    mockUsePathname.mockReturnValue("/");
    const { container } = renderJa();
    const button = screen.getByRole("button");
    const id = button.getAttribute("aria-controls");
    expect(id).toBeTruthy();
    const list = container.querySelector("ul")!;
    expect(list).toHaveAttribute("id", id!);
    expect(list).toHaveAttribute("aria-label", "言語を選ぶ");
  });

  it("閉じているとき一覧は hidden、開くと外れる", () => {
    mockUsePathname.mockReturnValue("/");
    const { container } = renderJa();
    const list = container.querySelector("ul")!;
    expect(list).toHaveAttribute("hidden");
    expect(list).not.toBeVisible();
    fireEvent.click(screen.getByRole("button"));
    expect(list).not.toHaveAttribute("hidden");
    expect(list).toBeVisible();
  });
});
