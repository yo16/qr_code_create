import React from "react";
import { render } from "@testing-library/react";
import type { Metadata } from "next";
import GuidePage, { generateMetadata as guideMeta } from "@/app/(ja)/(marketing)/guide/[slug]/page";
import UseCasePage, { generateMetadata as useCaseMeta } from "@/app/(ja)/(marketing)/use-cases/[slug]/page";
import BlogPage, { generateMetadata as blogMeta } from "@/app/(ja)/(marketing)/blog/[slug]/page";

// updated を持つ記事を作り、use-cases・blog・ja の guide でも modifiedTime と dateModified が updated になることを確かめる
// （date だけを使う退行で落ちる）
jest.mock("next-mdx-remote/rsc", () => ({ MDXRemote: () => null }));
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("notFound called");
  }),
}));
jest.mock("next/link", () => {
  const MockLink = ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>;
  MockLink.displayName = "MockLink";
  return MockLink;
});
jest.mock("@/lib/analytics/events", () => ({ trackCtaClicked: jest.fn() }));
jest.mock("@/components/seo/JsonLd", () => ({
  JsonLd: ({ data }: { data: unknown }) => <script type="application/ld+json">{JSON.stringify(data)}</script>,
}));

const DATES = { date: "2026-01-01", updated: "2026-09-09" };

jest.mock("@/lib/content/getGuide", () => ({
  ...jest.requireActual<typeof import("@/lib/content/getGuide")>("@/lib/content/getGuide"),
  getGuide: (slug: string) => ({ slug, title: "G", description: "gd", ...{ date: "2026-01-01", updated: "2026-09-09" }, content: "" }),
}));
jest.mock("@/lib/content/getUseCase", () => ({
  ...jest.requireActual<typeof import("@/lib/content/getUseCase")>("@/lib/content/getUseCase"),
  getUseCase: (slug: string) => ({
    slug,
    title: "U",
    description: "ud",
    ...{ date: "2026-01-01", updated: "2026-09-09" },
    order: 1,
    content: "",
  }),
}));
jest.mock("@/lib/content/getBlog", () => ({
  ...jest.requireActual<typeof import("@/lib/content/getBlog")>("@/lib/content/getBlog"),
  getBlog: (slug: string) => ({
    slug,
    title: "B",
    description: "bd",
    ...{ date: "2026-01-01", updated: "2026-09-09" },
    content: "",
  }),
}));

interface Posting {
  "@type": string;
  dateModified?: string;
  datePublished?: string;
}
type OgArticle = { type?: string; publishedTime?: string; modifiedTime?: string };
const og = (m: Metadata): OgArticle => (m.openGraph ?? {}) as OgArticle;

function postingOf(container: HTMLElement): Posting {
  const nodes = Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map(
    (s) => JSON.parse(s.textContent ?? "") as Posting
  );
  const p = nodes.find((n) => n["@type"] === "BlogPosting");
  if (!p) throw new Error("BlogPosting が見つかりません");
  return p;
}

const params = { params: Promise.resolve({ slug: "any" }) };

describe("updated を持つ記事（モック）", () => {
  it.each([
    ["guide", guideMeta],
    ["use-cases", useCaseMeta],
    ["blog", blogMeta],
  ])("%s の generateMetadata が publishedTime=date、modifiedTime=updated になること", async (_label, meta) => {
    const m = await meta(params);
    expect(og(m)).toMatchObject({ type: "article", publishedTime: DATES.date, modifiedTime: DATES.updated });
  });

  it.each([
    ["guide", GuidePage],
    ["use-cases", UseCasePage],
    ["blog", BlogPage],
  ])("%s の BlogPosting が datePublished=date、dateModified=updated になること", async (_label, Page) => {
    const { container } = render((await Page(params)) as React.ReactElement);
    const p = postingOf(container);
    expect(p.datePublished).toBe(DATES.date);
    expect(p.dateModified).toBe(DATES.updated);
  });
});
