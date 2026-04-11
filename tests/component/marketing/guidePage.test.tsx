import React from "react";
import { render, screen } from "@testing-library/react";
import GuidePage, {
  generateStaticParams,
  generateMetadata,
} from "@/app/(marketing)/guide/[slug]/page";

jest.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: ({ source }: { source: string }) => (
    <div data-testid="mdx-content">{source}</div>
  ),
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("notFound called");
  }),
}));

jest.mock("next/link", () => {
  const MockLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

const { notFound } = jest.requireMock("next/navigation") as { notFound: jest.Mock };

describe("GuidePage", () => {
  beforeEach(() => {
    notFound.mockClear();
  });

  describe("有効なslugでのレンダリング", () => {
    it("'utm-parameters' でページがレンダリングされること", async () => {
      const jsx = await GuidePage({ params: Promise.resolve({ slug: "utm-parameters" }) });
      render(jsx as React.ReactElement);
      expect(screen.getByTestId("mdx-content")).toBeInTheDocument();
    });

    it("見出し（h1）にタイトルが表示されること", async () => {
      const jsx = await GuidePage({ params: Promise.resolve({ slug: "utm-parameters" }) });
      render(jsx as React.ReactElement);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBeTruthy();
    });

    it("パンくずリストが表示されること", async () => {
      const jsx = await GuidePage({ params: Promise.resolve({ slug: "utm-parameters" }) });
      render(jsx as React.ReactElement);
      expect(screen.getByRole("navigation", { name: "パンくずリスト" })).toBeInTheDocument();
    });

    it("パンくずリストに「使い方ガイド」リンクが含まれること", async () => {
      const jsx = await GuidePage({ params: Promise.resolve({ slug: "utm-parameters" }) });
      render(jsx as React.ReactElement);
      expect(screen.getByRole("link", { name: "使い方ガイド" })).toBeInTheDocument();
    });

    it("日付が表示されること", async () => {
      const jsx = await GuidePage({ params: Promise.resolve({ slug: "utm-parameters" }) });
      render(jsx as React.ReactElement);
      expect(screen.getByText(/\d{4}-\d{2}-\d{2}/)).toBeInTheDocument();
    });
  });

  describe("不正なslugの処理", () => {
    it("不正なslugでnotFoundが呼ばれること", async () => {
      await expect(
        GuidePage({ params: Promise.resolve({ slug: "nonexistent-slug" }) })
      ).rejects.toThrow("notFound called");
      expect(notFound).toHaveBeenCalled();
    });
  });
});

describe("generateStaticParams", () => {
  it("4つのslugを返すこと", async () => {
    const params = await generateStaticParams();
    expect(params).toHaveLength(4);
  });

  it("各要素がslugプロパティを持つこと", async () => {
    const params = await generateStaticParams();
    params.forEach((param) => {
      expect(param).toHaveProperty("slug");
      expect(typeof param.slug).toBe("string");
    });
  });

  it("期待するslugがすべて含まれること", async () => {
    const params = await generateStaticParams();
    const slugs = params.map((p) => p.slug);
    expect(slugs).toContain("utm-parameters");
    expect(slugs).toContain("effective-qr-usage");
    expect(slugs).toContain("design-tips");
    expect(slugs).toContain("analytics-measurement");
  });
});

describe("generateMetadata", () => {
  it("有効なslugでメタデータを返すこと", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "utm-parameters" }),
    });
    expect(metadata).toBeTruthy();
    expect(metadata.title).toBeTruthy();
    expect(metadata.description).toBeTruthy();
  });

  it("不正なslugで空オブジェクトを返すこと", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "nonexistent-slug" }),
    });
    expect(metadata).toEqual({});
  });
});
