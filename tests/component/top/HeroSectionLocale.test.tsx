import React from "react";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "@/components/top/HeroSection";
import { getDict } from "@/i18n/getDict";

jest.mock("@/lib/analytics/events", () => ({
  trackCtaClicked: jest.fn(),
}));

describe("HeroSection: locale 別のリンク", () => {
  it("ja はガイドへのリンクが /guide、作成が /create", () => {
    render(<HeroSection locale="ja" />);
    const { hero } = getDict("ja").home;
    expect(screen.getByRole("link", { name: hero.secondaryCta })).toHaveAttribute("href", "/guide");
    expect(screen.getByRole("link", { name: hero.primaryCta })).toHaveAttribute("href", "/create");
  });

  it("en はガイドへのリンクが /en/guide/getting-started、作成が /en/create", () => {
    render(<HeroSection locale="en" />);
    const { hero } = getDict("en").home;
    expect(screen.getByRole("link", { name: hero.secondaryCta })).toHaveAttribute(
      "href",
      "/en/guide/getting-started"
    );
    expect(screen.getByRole("link", { name: hero.primaryCta })).toHaveAttribute(
      "href",
      "/en/create"
    );
  });

  it("en では日本語の /guide を指すリンクが無い", () => {
    render(<HeroSection locale="en" />);
    expect(
      screen.getAllByRole("link").some((a) => a.getAttribute("href") === "/guide")
    ).toBe(false);
  });
});
