import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getUseCase, getUseCaseSlugList } from "@/lib/content/getUseCase";

const CONTENT_DIR = path.join(process.cwd(), "src/content/use-cases");
const SLUGS = ["business-card", "flyer", "poster"];

describe("use-cases MDX batch1: 名刺・チラシ・ポスター", () => {
  describe.each(SLUGS)("%s.mdx", (slug) => {
    const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

    it("ファイルが存在すること", () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("frontmatterにtitle, description, date, order, utmSource, presetが含まれること", () => {
      const fileContents = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(fileContents);
      expect(typeof data.title).toBe("string");
      expect(data.title.length).toBeGreaterThan(0);
      expect(typeof data.description).toBe("string");
      expect(data.description.length).toBeGreaterThan(0);
      expect(typeof data.date).toBe("string");
      expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof data.order).toBe("number");
      expect(typeof data.utmSource).toBe("string");
      expect(typeof data.preset).toBe("string");
    });

    it("コンテンツに推奨UTM設定セクションが含まれること", () => {
      const fileContents = fs.readFileSync(filePath, "utf-8");
      const { content } = matter(fileContents);
      expect(content).toMatch(/UTM設定/);
    });

    it("コンテンツに印刷サイズセクションが含まれること", () => {
      const fileContents = fs.readFileSync(filePath, "utf-8");
      const { content } = matter(fileContents);
      expect(content).toMatch(/印刷サイズ/);
    });

    it("コンテンツに活用例セクションが含まれること", () => {
      const fileContents = fs.readFileSync(filePath, "utf-8");
      const { content } = matter(fileContents);
      expect(content).toMatch(/活用例/);
    });

    it("文字化けが含まれないこと", () => {
      const fileContents = fs.readFileSync(filePath, "utf-8");
      const { content } = matter(fileContents);
      expect(content).not.toMatch(/\ufffd/);
    });

    it("getUseCase関数でnull以外が返ること", () => {
      const result = getUseCase(slug);
      expect(result).not.toBeNull();
      expect(result?.slug).toBe(slug);
    });
  });

  it("getUseCaseSlugListに3つのslugが含まれること", () => {
    const slugList = getUseCaseSlugList();
    for (const slug of SLUGS) {
      expect(slugList).toContain(slug);
    }
  });

  it("各記事のorderが重複しないこと", () => {
    const orders = SLUGS.map((slug) => getUseCase(slug)?.order).filter((o) => o !== undefined);
    const uniqueOrders = new Set(orders);
    expect(uniqueOrders.size).toBe(orders.length);
  });
});

describe("poster.mdx の節の順序（qr_code_create-frp）", () => {
  // 背景: /use-cases/poster は直帰率が高く、検索意図（印刷サイズ）に答える表がページ下部にあった。
  // 契約: 「## ポスターへの印刷サイズの目安」節を本文冒頭（メリット節の前）に移動し、他の節の相対順序は維持する。
  const POSTER_PATH = path.join(CONTENT_DIR, "poster.mdx");
  const SIZE_H2 = "## ポスターへの印刷サイズの目安";
  const MERIT_H2 = "## ポスターにQRコードを掲載するメリット";

  const readContent = (): string => {
    const fileContents = fs.readFileSync(POSTER_PATH, "utf-8");
    return matter(fileContents).content;
  };

  const getH2Lines = (content: string): string[] =>
    content.split(/\r?\n/).filter((line) => line.startsWith("## "));

  it("印刷サイズの目安の節がメリットの節より前にあること", () => {
    // 意図: 検索流入の主目的である印刷サイズ情報を、メリット説明より先に読めるようにする
    const content = readContent();
    const sizeIndex = content.indexOf(SIZE_H2);
    const meritIndex = content.indexOf(MERIT_H2);
    expect(sizeIndex).not.toBe(-1);
    expect(meritIndex).not.toBe(-1);
    expect(sizeIndex).toBeLessThan(meritIndex);
  });

  it("印刷サイズの節が本文の最初の h2 であること", () => {
    // 意図: frontmatter 直後の最初の見出しが印刷サイズの節であり、ファーストビューで表に到達できる
    const content = readContent();
    const h2Lines = getH2Lines(content);
    expect(h2Lines.length).toBeGreaterThan(0);
    expect(h2Lines[0]).toBe(SIZE_H2);
  });

  it("印刷サイズの表（A4 / A3 / B2 / B1 の行）が印刷サイズの節の中に含まれること", () => {
    // 意図: 節の移動時に表が置き去りにならず、h2 配下（次の h2 の直前まで）に表が残っていることを保証する
    const content = readContent();
    const sizeIndex = content.indexOf(SIZE_H2);
    expect(sizeIndex).not.toBe(-1);
    const afterHeading = sizeIndex + SIZE_H2.length;
    const nextH2Match = /^## /m.exec(content.slice(afterHeading));
    const sectionEnd = nextH2Match ? afterHeading + nextH2Match.index : content.length;
    const section = content.slice(sizeIndex, sectionEnd);
    expect(section).toContain("| A4");
    expect(section).toContain("| A3");
    expect(section).toContain("| B2");
    expect(section).toContain("| B1");
  });

  it("他の h2 の相対順序が維持されていること", () => {
    // 意図: 印刷サイズ以外の節の並びは変更しない（移動以外の意図しない並び替えを検出する）
    const content = readContent();
    const otherH2Lines = getH2Lines(content).filter((line) => line !== SIZE_H2);
    expect(otherH2Lines).toEqual([
      MERIT_H2,
      "## ポスター用QRコードの推奨UTM設定",
      // qr_code_create-fyt で意図して追加: 印刷用ポスター（/poster）への導線の節（推奨UTM設定の後、おすすめデザインの前）
      "## 複数の場所に同じQRを掲示する",
      "## ポスター用QRコードのおすすめデザイン",
      "## ポスター用QRコードの活用例",
      "## まとめ",
    ]);
  });

  it("h2 の総数が 7 であること（frp の 6 + fyt で追加した 1 節）", () => {
    // 意図: 節の追加・削除・重複が意図せず起きていないことを保証する。fyt で「複数の場所に同じQRを掲示する」を 1 つ追加した
    const content = readContent();
    expect(getH2Lines(content)).toHaveLength(7);
  });
});
