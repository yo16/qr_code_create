import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";

const MDX_FILE_PATH = path.join(
  process.cwd(),
  "src/content/guide/download-formats.mdx"
);

describe("download-formats.mdx ファイル存在確認", () => {
  it("src/content/guide/download-formats.mdx が存在すること", () => {
    expect(fs.existsSync(MDX_FILE_PATH)).toBe(true);
  });
});

describe("download-formats.mdx frontmatterバリデーション", () => {
  let frontmatter: Record<string, unknown>;
  let content: string;

  beforeAll(() => {
    const fileContents = fs.readFileSync(MDX_FILE_PATH, "utf-8");
    const parsed = matter(fileContents);
    frontmatter = parsed.data as Record<string, unknown>;
    content = parsed.content;
  });

  it("title が文字列で存在すること", () => {
    expect(typeof frontmatter.title).toBe("string");
    expect((frontmatter.title as string).length).toBeGreaterThan(0);
  });

  it("description が文字列で存在すること", () => {
    expect(typeof frontmatter.description).toBe("string");
    expect((frontmatter.description as string).length).toBeGreaterThan(0);
  });

  it("date が YYYY-MM-DD 形式であること", () => {
    expect(typeof frontmatter.date).toBe("string");
    expect(frontmatter.date as string).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("order が数値で 13 であること", () => {
    expect(typeof frontmatter.order).toBe("number");
    expect(frontmatter.order).toBe(13);
  });

  it("コンテンツにPNG形式の説明が含まれること", () => {
    expect(content).toMatch(/PNG/);
  });

  it("コンテンツにSVG形式の説明が含まれること", () => {
    expect(content).toMatch(/SVG/);
  });

  it("コンテンツにPDF形式の説明が含まれること", () => {
    expect(content).toMatch(/PDF/);
  });

  it("コンテンツに解像度1xの説明が含まれること", () => {
    expect(content).toMatch(/1x/);
  });

  it("コンテンツに解像度2xの説明が含まれること", () => {
    expect(content).toMatch(/2x/);
  });

  it("コンテンツに解像度4xの説明が含まれること", () => {
    expect(content).toMatch(/4x/);
  });

  it("コンテンツに誤った3x解像度が含まれないこと", () => {
    expect(content).not.toMatch(/\b3x\b/);
  });

  it("コンテンツに文字化けが含まれないこと", () => {
    expect(content).not.toMatch(/\ufffd/);
  });
});

describe("getGuide 関数との統合: download-formats", () => {
  it("getGuide('download-formats') が null でない値を返すこと", () => {
    const result = getGuide("download-formats");
    expect(result).not.toBeNull();
  });

  it("返り値の slug が 'download-formats' であること", () => {
    const result = getGuide("download-formats");
    expect(result?.slug).toBe("download-formats");
  });

  it("返り値の order が 13 であること", () => {
    const result = getGuide("download-formats");
    expect(result?.order).toBe(13);
  });

  it("返り値の title が非空の文字列であること", () => {
    const result = getGuide("download-formats");
    expect(typeof result?.title).toBe("string");
    expect(result!.title.length).toBeGreaterThan(0);
  });

  it("返り値の description が非空の文字列であること", () => {
    const result = getGuide("download-formats");
    expect(typeof result?.description).toBe("string");
    expect(result!.description.length).toBeGreaterThan(0);
  });

  it("返り値の date が YYYY-MM-DD 形式であること", () => {
    const result = getGuide("download-formats");
    expect(result?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("返り値の content が非空であること", () => {
    const result = getGuide("download-formats");
    expect(typeof result?.content).toBe("string");
    expect(result!.content.length).toBeGreaterThan(0);
  });
});

describe("getGuideSlugList 関数: download-formats の存在確認", () => {
  it("slugリストに 'download-formats' が含まれること", () => {
    const result = getGuideSlugList();
    expect(result).toContain("download-formats");
  });
});

describe("order の一意性確認", () => {
  it("order: 13 が他のガイド記事と重複しないこと", () => {
    const slugs = getGuideSlugList();
    const orders = slugs
      .map((slug) => getGuide(slug))
      .filter((g) => g !== null)
      .map((g) => ({ slug: g.slug, order: g.order }));
    const order13Items = orders.filter((o) => o.order === 13);
    expect(order13Items.length).toBe(1);
    expect(order13Items[0].slug).toBe("download-formats");
  });
});

// qr_code_create-djy: 「印刷用ポスター（A4 PDF）」の節
describe("download-formats.mdx 印刷用ポスターの節", () => {
  const body = matter(fs.readFileSync(MDX_FILE_PATH, "utf-8")).content;
  const HEADING = "## 印刷用ポスター（A4 PDF）";
  const section = (() => {
    const start = body.indexOf(HEADING);
    const rest = body.slice(start + HEADING.length);
    const next = rest.indexOf(String.fromCharCode(10) + "## ");
    return next === -1 ? rest : rest.slice(0, next);
  })();

  it("PDF 形式の節と解像度の選び方の節の間に「## 印刷用ポスター（A4 PDF）」があること", () => {
    const pdf = body.indexOf("## PDF形式");
    const poster = body.indexOf(HEADING);
    const resolution = body.indexOf("## 解像度の選び方");
    expect(pdf).toBeGreaterThanOrEqual(0);
    expect(poster).toBeGreaterThan(pdf);
    expect(resolution).toBeGreaterThan(poster);
  });

  it("節の中に /poster と /create へのリンクがあること", () => {
    expect(section).toContain("](/poster)");
    expect(section).toContain("](/create)");
  });

  it("カードの大きさ「105mm × 148.5mm」が、A4 の 4 分の 1（210 x 297 の半分ずつ）と一致すること", () => {
    expect(section).toContain("105mm × 148.5mm");
    expect(210 / 2).toBe(105);
    expect(297 / 2).toBe(148.5);
  });

  it("説明文の目安「500文字」が MarkdownInput の DESCRIPTION_SOFT_LIMIT と一致すること", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/poster/MarkdownInput/MarkdownInput.tsx"),
      "utf-8"
    );
    const limit = source.match(/DESCRIPTION_SOFT_LIMIT\s*=\s*(\d+)/)?.[1];
    expect(limit).toBeDefined();
    expect(section).toContain(`${limit}文字`);
  });

  it("導線ボタンの文言が jaClient の posterCta と一致すること", () => {
    const { jaClient } = jest.requireActual("@/i18n/jaClient") as {
      jaClient: { tool: { download: { posterCta: string } } };
    };
    expect(section).toContain(`「${jaClient.tool.download.posterCta}」`);
  });

  it("ダウンロードボタンの文言（PDFをダウンロード（A4印刷用））に触れる場合、PdfDownloadButton の文言と一致すること", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/poster/PdfDownloadButton/PdfDownloadButton.tsx"),
      "utf-8"
    );
    const quoted = section.match(/「(PDFをダウンロード[^」]*)」/g) ?? [];
    for (const q of quoted) {
      expect(source).toContain(q.slice(1, -1));
    }
  });

  it("「用途別おすすめ形式」の表に印刷用ポスターの行があること", () => {
    const table = body.slice(body.indexOf("## 用途別おすすめ形式"));
    expect(table).toContain("| イベントやアンケートの案内を印刷して配る | 印刷用ポスター（A4 PDF） | - |");
  });

  it("まとめに印刷用ポスターへの言及があること", () => {
    const summary = body.slice(body.indexOf("## まとめ"));
    expect(summary).toContain("印刷用ポスター（A4 PDF）");
  });
});
