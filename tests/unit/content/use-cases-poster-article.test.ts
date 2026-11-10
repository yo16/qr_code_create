/**
 * @jest-environment node
 */
// qr_code_create-b8y（集客実験 E4）: /use-cases/poster の title / description の書き換えと updated の追加を守る。
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { generateMetadata } from "@/app/(ja)/(marketing)/use-cases/[slug]/page";
import sitemap from "@/app/sitemap";

jest.mock("next-mdx-remote/rsc", () => ({ MDXRemote: () => null }));
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("notFound called");
  }),
}));

const TITLE = "ポスター用QRコードの大きさと距離の目安、効果の測り方";
const DESCRIPTION =
  "ポスターに載せるQRコードの大きさを、A4からB1以上まで読み取り距離別の表で紹介します。掲示場所ごとの効果の測り方と、A4に4枚並べる印刷用PDFの作り方も解説します。";
const SITE_NAME = "QR Code Create";
const FILE = path.join(process.cwd(), "src/content/use-cases/poster.mdx");
const raw = matter(fs.readFileSync(FILE, "utf-8"));

// ダッシュ類（— ― – ―）と絵文字
const DASH = /[—―–‒]/;
const EMOJI = /\p{Extended_Pictographic}|️|‍/u;

describe("/use-cases/poster の metadata", () => {
  it("title / og:title / twitter:title / description が新しい文で、サイト名が og と twitter に 1 回だけ付くこと", async () => {
    const m = await generateMetadata({ params: Promise.resolve({ slug: "poster" }) });
    expect(m.title).toBe(TITLE);
    expect(m.description).toBe(DESCRIPTION);
    expect(m.openGraph?.title).toBe(`${TITLE} | ${SITE_NAME}`);
    expect(m.openGraph?.description).toBe(DESCRIPTION);
    expect(m.twitter?.title).toBe(`${TITLE} | ${SITE_NAME}`);
    expect(String(m.openGraph?.title).split(SITE_NAME)).toHaveLength(2);
    // ページ側の title にサイト名は含まない（template が 1 回付ける）
    expect(String(m.title)).not.toContain(SITE_NAME);
  });

  it("og:type が article で、modifiedTime が 2026-11-10、publishedTime が 2026-04-17 であること", async () => {
    const m = await generateMetadata({ params: Promise.resolve({ slug: "poster" }) });
    expect(m.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-04-17",
      modifiedTime: "2026-11-10",
    });
  });
});

describe("poster.mdx の frontmatter", () => {
  it("title と description が指定の文で、updated が 2026-11-10 であること", () => {
    expect(raw.data.title).toBe(TITLE);
    expect(raw.data.description).toBe(DESCRIPTION);
    expect(String(raw.data.updated)).toContain("2026-11-10");
  });

  it("title と description にダッシュと絵文字がないこと", () => {
    for (const text of [TITLE, DESCRIPTION, String(raw.data.title), String(raw.data.description)]) {
      expect(text).not.toMatch(DASH);
      expect(text).not.toMatch(EMOJI);
    }
  });
});

describe("description で約束している 3 点が本文にあること", () => {
  const body = raw.content;

  it("読み取り距離のサイズ表に 30mm・40mm・60mm・100mm の行があること", () => {
    const rows = body.split("\n").filter((l) => l.startsWith("|"));
    for (const size of ["30mm", "40mm", "60mm", "100mm"]) {
      expect(rows.some((l) => l.includes(`${size} x ${size}以上`) && /(cm|m)\s*(以上)?\s*\|\s*$/.test(l))).toBe(true);
    }
    expect(body).toContain("読み取り距離");
  });

  it("utm_content による掲示場所別の計測が書かれていること", () => {
    expect(body).toContain("### 掲示場所ごとの計測");
    expect(body).toMatch(/掲示場所ごとの計測[\s\S]*`utm_content` で場所を区別/);
  });

  it("A4 に 4 枚の印刷用ポスターへのリンク /poster があること", () => {
    expect(body).toContain("](/poster)");
    expect(body).toMatch(/A4.*4枚|4枚.*A4/);
  });

  it("サイズ表の行ごとに、ポスターサイズ・QRサイズ・読み取り距離の組が対応していること", () => {
    const cells = (l: string) => l.split("|").map((c) => c.trim()).filter(Boolean);
    const rows = body.split("\n").filter((l) => l.startsWith("|")).map(cells);
    const find = (size: string) => rows.find((r) => r[0].startsWith(size));
    expect(find("A4")).toEqual(["A4（小型POP）", "30mm x 30mm以上", "20〜30cm"]);
    expect(find("A3")).toEqual(["A3", "40mm x 40mm以上", "30〜50cm"]);
    expect(find("B2")).toEqual(["B2", "60mm x 60mm以上", "50cm〜1m"]);
    expect(find("B1")).toEqual(["B1以上（大判）", "100mm x 100mm以上", "1m以上"]);
  });

  it("推奨UTMの表に utm_source=poster、utm_medium=qr、utm_campaign=event_2026 の行があり、frontmatter の utmSource が poster であること", () => {
    const cells = (l: string) => l.split("|").map((c) => c.trim()).filter(Boolean);
    const rows = body.split("\n").filter((l) => l.startsWith("|")).map(cells);
    expect(rows).toContainEqual(expect.arrayContaining(["utm_source", "`poster`"]));
    expect(rows).toContainEqual(expect.arrayContaining(["utm_medium", "`qr`"]));
    expect(rows).toContainEqual(expect.arrayContaining(["utm_campaign", "`event_2026`"]));
    expect(raw.data.utmSource).toBe("poster");
  });

  it("本文にダッシュ（— ― –）がないこと（「〜」は対象外）", () => {
    expect(body).not.toMatch(DASH);
  });
});

describe("sitemap の lastmod", () => {
  it("/use-cases/poster の lastModified が 2026-11-10 で、他の use-cases は updated なしの date のままであること", () => {
    const result = sitemap();
    const entry = result.find((e) => new URL(e.url).pathname === "/use-cases/poster");
    expect(entry?.lastModified).toBe("2026-11-10");
    const event = result.find((e) => new URL(e.url).pathname === "/use-cases/event");
    expect(event?.lastModified).not.toBe("2026-11-10");
  });
});

describe("yomiyasu 基準 JSON", () => {
  it("poster.mdx が基準に戻っていないこと（lint 必須の記事であること）", () => {
    const baseline = fs.readFileSync(path.join(process.cwd(), "tests/fixtures/yomiyasu-baseline.json"), "utf-8");
    expect(baseline).not.toContain("use-cases/poster.mdx");
  });
});
