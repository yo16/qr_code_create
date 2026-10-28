import { render, screen } from "@testing-library/react";
import { LocaleNotFound } from "@/components/layout/LocaleNotFound";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getClientMessages } from "@/i18n/getDict";

describe("LocaleNotFound", () => {
  it("en の辞書の見出しと本文を表示する", () => {
    const copy = getClientMessages("en").common.notFound;
    render(
      <I18nProvider locale="en" messages={getClientMessages("en")}>
        <LocaleNotFound />
      </I18nProvider>
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(copy.title);
    expect(screen.getByText(copy.body)).toBeInTheDocument();
  });

  it("トップへのリンクが /en を指す", () => {
    const copy = getClientMessages("en").common.notFound;
    render(
      <I18nProvider locale="en" messages={getClientMessages("en")}>
        <LocaleNotFound />
      </I18nProvider>
    );
    expect(screen.getByRole("link", { name: copy.link })).toHaveAttribute("href", "/en");
  });

  it("Provider が無い（ja）場合は ja の文言で、リンクは /", () => {
    const copy = getClientMessages("ja").common.notFound;
    render(<LocaleNotFound />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(copy.title);
    expect(screen.getByRole("link", { name: copy.link })).toHaveAttribute("href", "/");
  });
});
