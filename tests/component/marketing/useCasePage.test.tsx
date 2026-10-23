import React from "react";
import { render, screen } from "@testing-library/react";
import UseCasePage from "@/app/(marketing)/use-cases/[slug]/page";

/**
 * UseCasePage（/use-cases/[slug]）のテスト
 *
 * 用途別ページの本文末尾に、frontmatter の preset / utmSource を引き継いだ
 * 「この設定でQRコードを作成する」CTA が置かれることを検証する。
 * 契約: <ArticleCta text="この設定でQRコードを作成する" href={buildCreateHref({ preset, utmSource })} />
 * モック構成は guidePage.test.tsx と揃える。
 */

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
  const MockLink = ({
    href,
    children,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

// ArticleCta 内部で呼ばれる trackCtaClicked が gtag に触れないようモックする
jest.mock("@/lib/analytics/events", () => ({
  trackCtaClicked: jest.fn(),
}));

const { notFound } = jest.requireMock("next/navigation") as { notFound: jest.Mock };

describe("UseCasePage", () => {
  beforeEach(() => {
    notFound.mockClear();
  });

  describe("有効なslugでのレンダリング", () => {
    it("'poster' で見出し（h1）が描画されること", async () => {
      // 意図: ページ自体が正常に描画できることの前提確認。
      const jsx = await UseCasePage({ params: Promise.resolve({ slug: "poster" }) });
      render(jsx as React.ReactElement);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBeTruthy();
    });

    it("'poster' で本文が描画されること", async () => {
      // 意図: MDX 本文が描画されていること（CTA が本文を置き換えていないこと）。
      const jsx = await UseCasePage({ params: Promise.resolve({ slug: "poster" }) });
      render(jsx as React.ReactElement);
      expect(screen.getByTestId("mdx-content")).toBeInTheDocument();
    });
  });

  describe("本文末尾のCTA", () => {
    it("「この設定でQRコードを作成する」リンクが描画されること", async () => {
      // 意図: 用途別ページでは文言が「この設定で〜」に差し替えられていること。
      const jsx = await UseCasePage({ params: Promise.resolve({ slug: "poster" }) });
      render(jsx as React.ReactElement);
      expect(
        screen.getByRole("link", { name: "この設定でQRコードを作成する" })
      ).toBeInTheDocument();
    });

    it("CTA リンクの href が \"/create?utm_source=poster&utm_medium=qr&preset=elegant\" であること", async () => {
      // 意図: poster.mdx の frontmatter（preset: elegant, utmSource: poster）が
      //       buildCreateHref 経由で CTA のリンク先に引き継がれ、utm_medium=qr が自動付与されること。
      const jsx = await UseCasePage({ params: Promise.resolve({ slug: "poster" }) });
      render(jsx as React.ReactElement);
      const link = screen.getByRole("link", { name: "この設定でQRコードを作成する" });
      expect(link).toHaveAttribute(
        "href",
        "/create?utm_source=poster&utm_medium=qr&preset=elegant"
      );
    });

    it("CTA が本文（MDX）より後に配置されていること", async () => {
      // 意図: 「本文末尾」の CTA であること。本文より前に置かれると読了前の離脱を招く。
      const jsx = await UseCasePage({ params: Promise.resolve({ slug: "poster" }) });
      render(jsx as React.ReactElement);
      const content = screen.getByTestId("mdx-content");
      const link = screen.getByRole("link", { name: "この設定でQRコードを作成する" });
      // DOCUMENT_POSITION_FOLLOWING (4): link が content の後方にある
      expect(content.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  describe("不正なslugの処理", () => {
    it("存在しないslugでnotFoundが呼ばれること", async () => {
      // 意図: 不正な slug で 404 になること（CTA 追加で分岐が壊れていないこと）。
      await expect(
        UseCasePage({ params: Promise.resolve({ slug: "nonexistent-slug" }) })
      ).rejects.toThrow("notFound called");
      expect(notFound).toHaveBeenCalled();
    });
  });
});
