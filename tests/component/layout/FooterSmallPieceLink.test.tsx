import React from "react";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/Footer/Footer";
import { LOCALES } from "@/i18n/locales";

/** qr_code_create-1rq: フッターの Small Piece リンクが UTM 付きで、全言語で同じ形であること */

const EXPECTED_HREF =
  "https://smallpiece.jp/?utm_source=qr-code-create&utm_medium=referral&utm_content=footer";

describe.each([...LOCALES])("Footer の Small Piece リンク locale=%s", (locale) => {
  it("href が UTM 付きの URL に完全一致する", () => {
    render(<Footer locale={locale} />);
    expect(screen.getByRole("link", { name: "Small Piece" })).toHaveAttribute("href", EXPECTED_HREF);
  });

  it("UTM は source/medium/content のみで utm_campaign が無い", () => {
    render(<Footer locale={locale} />);
    const href = screen.getByRole("link", { name: "Small Piece" }).getAttribute("href") ?? "";
    const url = new URL(href);
    expect(url.origin).toBe("https://smallpiece.jp");
    expect(url.searchParams.get("utm_source")).toBe("qr-code-create");
    expect(url.searchParams.get("utm_medium")).toBe("referral");
    expect(url.searchParams.get("utm_content")).toBe("footer");
    expect([...url.searchParams.keys()].sort()).toEqual(["utm_content", "utm_medium", "utm_source"]);
  });

  it("新しいタブで開き、noopener noreferrer が付く", () => {
    render(<Footer locale={locale} />);
    const link = screen.getByRole("link", { name: "Small Piece" });
    expect(link).toHaveAttribute("target", "_blank");
    const rel = (link.getAttribute("rel") ?? "").split(/\s+/);
    expect(rel).toContain("noopener");
    expect(rel).toContain("noreferrer");
  });

  it("「Built by」が表示される", () => {
    const { container } = render(<Footer locale={locale} />);
    expect(container).toHaveTextContent("Built by Small Piece");
  });
});
