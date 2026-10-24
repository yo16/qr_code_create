import React from "react";
import { render, screen } from "@testing-library/react";
import GuidePage, {
  generateStaticParams,
  generateMetadata,
} from "@/app/(ja)/(marketing)/guide/[slug]/page";
import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";

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

// ArticleCta 内部で呼ばれる trackCtaClicked が gtag に触れないようモックする
jest.mock("@/lib/analytics/events", () => ({
  trackCtaClicked: jest.fn(),
}));

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

  describe("本文末尾のCTA", () => {
    it("本文の後に「QRコードを作成する」リンク（href=\"/create\"）があること", async () => {
      // 意図: 検索流入で本文を読み終えた人がツールへ到達できるよう、
      //       ガイド本文（MDX）の直後に ArticleCta（既定 href "/create"）が置かれていること。
      const jsx = await GuidePage({ params: Promise.resolve({ slug: "utm-parameters" }) });
      render(jsx as React.ReactElement);
      const content = screen.getByTestId("mdx-content");
      const link = screen.getByRole("link", { name: "QRコードを作成する" });
      expect(link).toHaveAttribute("href", "/create");
      // DOCUMENT_POSITION_FOLLOWING (4): link が content の後方にある
      expect(content.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  describe("HowTo 構造化データ", () => {
    // 描画された JSON-LD の <script type="application/ld+json"> をすべて JSON.parse して返す
    const readJsonLdScripts = (): Record<string, unknown>[] =>
      Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
        (el) => JSON.parse(el.textContent ?? "") as Record<string, unknown>
      );

    // 意図: マーケティング戦略 P0 の HowTo スキーマが getting-started で出力されること。
    //       frontmatter の howto（3 ステップ）から @type 'HowTo' を 1 件生成し、name はガイドの
    //       タイトル、各 step の url はページ内アンカー（/guide/getting-started#step-N）を指す。
    it("'getting-started' で @type 'HowTo' の JSON-LD が 1 件あり、step 3 件・name がタイトル・step url がアンカー付きであること", async () => {
      const jsx = await GuidePage({ params: Promise.resolve({ slug: "getting-started" }) });
      render(jsx as React.ReactElement);

      const howtos = readJsonLdScripts().filter((d) => d["@type"] === "HowTo");
      expect(howtos).toHaveLength(1);

      const howto = howtos[0] as {
        name: string;
        step: { "@type": string; name: string; text: string; url: string }[];
      };
      expect(howto.name).toBe(getGuide("getting-started")?.title);
      expect(howto.step).toHaveLength(3);
      howto.step.forEach((step, i) => {
        expect(step["@type"]).toBe("HowToStep");
        expect(typeof step.name).toBe("string");
        expect(typeof step.text).toBe("string");
        expect(step.url.endsWith(`/guide/getting-started#step-${i + 1}`)).toBe(true);
      });
    });

    // 意図: howto を持たないガイドでは HowTo を出力しない（空の HowTo や誤った手順を
    //       検索エンジンに渡さない）。従来どおり BlogPosting と BreadcrumbList の 2 件のみ。
    it("'utm-parameters' では HowTo の JSON-LD が無く、BlogPosting と BreadcrumbList の 2 件のみであること", async () => {
      const jsx = await GuidePage({ params: Promise.resolve({ slug: "utm-parameters" }) });
      render(jsx as React.ReactElement);

      const schemas = readJsonLdScripts();
      const types = schemas.map((d) => d["@type"]);
      expect(schemas).toHaveLength(2);
      expect(types).toContain("BlogPosting");
      expect(types).toContain("BreadcrumbList");
      expect(types).not.toContain("HowTo");
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
  it("getGuideSlugList() と同じ件数のslugを返すこと", async () => {
    const params = await generateStaticParams();
    const expectedCount = getGuideSlugList().length;
    expect(expectedCount).toBeGreaterThan(0);
    expect(params).toHaveLength(expectedCount);
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
    expect(slugs).toContain("getting-started");
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
