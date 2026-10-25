import React from "react";
import { render, screen } from "@testing-library/react";
import { GuideArticlePageView } from "@/components/pages/GuideArticlePageView/GuideArticlePageView";
import { GuideHeading } from "@/components/marketing/GuideHeading/GuideHeading";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getClientMessages } from "@/i18n/getDict";
import { getGuide } from "@/lib/content/getGuide";

// MDXRemote のモックが components を受け取り、h2 に GuideHeading が渡ることを確かめる
const mockReceived: { components?: Record<string, unknown> } = {};
jest.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: ({ components }: { components?: Record<string, React.ElementType> }) => {
    mockReceived.components = components;
    const H2 = components?.h2 ?? "h2";
    return (
      <div data-testid="mdx-content">
        <H2>ステップ1: URLを入力する</H2>
        <H2>まとめ</H2>
      </div>
    );
  },
}));
jest.mock("next/link", () => {
  const MockLink = ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>;
  MockLink.displayName = "MockLink";
  return MockLink;
});
jest.mock("@/lib/analytics/events", () => ({ trackCtaClicked: jest.fn() }));

describe("GuideArticlePageView の h2", () => {
  it.each(["ja", "en"] as const)("%s: MDXRemote の components.h2 に GuideHeading が渡り、ステップ見出しにだけ id が付くこと", (locale) => {
    const guide = getGuide("getting-started", locale)!;
    render(
      <I18nProvider locale={locale} messages={getClientMessages(locale)}>
        <GuideArticlePageView locale={locale} slug="getting-started" guide={guide} />
      </I18nProvider>
    );
    expect(mockReceived.components?.h2).toBe(GuideHeading);
    expect(screen.getByRole("heading", { level: 2, name: "ステップ1: URLを入力する" })).toHaveAttribute("id", "step-1");
    expect(screen.getByRole("heading", { level: 2, name: "まとめ" })).not.toHaveAttribute("id");
  });
});
