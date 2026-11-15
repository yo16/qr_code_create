/**
 * @jest-environment node
 */
// qr_code_create-m8h（集客実験 E7）: ブログ「年賀状にQRコードを載せて、年賀状から来た人を数える方法」
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { generateMetadata } from "@/app/(ja)/(marketing)/blog/[slug]/page";
import sitemap from "@/app/sitemap";
import { getAllBlogs } from "@/lib/content/getAllBlogs";
import { getBlogSlugList } from "@/lib/content/getBlog";
import { buildLlmsTxt } from "@/lib/seo/llmsTxt";
import { UTM_MEDIUM_VALUES, UTM_SOURCE_VALUES } from "@/lib/constants/utmPresets";
import { jaClient } from "@/i18n/jaClient";

jest.mock("next-mdx-remote/rsc", () => ({ MDXRemote: () => null }));
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("notFound called");
  }),
}));

const SLUG = "nenga-qr-utm-tracking";
const PATH_URL = `/blog/${SLUG}`;
const TITLE = "年賀状にQRコードを載せて、年賀状から来た人を数える方法";
const SITE_NAME = "QR Code Create";
const ROOT = process.cwd();
const FILE = path.join(ROOT, `src/content/blog/${SLUG}.mdx`);
const source = fs.readFileSync(FILE, "utf-8");
const parsed = matter(source);
const body = parsed.content;
const DASH = /[—―–]/;
const EMOJI = /\p{Extended_Pictographic}/u;

describe("metadata", () => {
  it("title / description が frontmatter と一致し、og:title にサイト名が 1 回だけ付くこと", async () => {
    const m = await generateMetadata({ params: Promise.resolve({ slug: SLUG }) });
    expect(m.title).toBe(TITLE);
    expect(m.description).toBe(parsed.data.description);
    expect(String(m.description).length).toBeGreaterThan(0);
    expect(m.openGraph?.title).toBe(`${TITLE} | ${SITE_NAME}`);
    expect(String(m.openGraph?.title).split(SITE_NAME)).toHaveLength(2);
    expect(String(m.title)).not.toContain(SITE_NAME);
  });

  it("og:type が article、publishedTime が 2026-11-15 であること", async () => {
    const m = await generateMetadata({ params: Promise.resolve({ slug: SLUG }) });
    expect(m.openGraph).toMatchObject({ type: "article", publishedTime: "2026-11-15" });
  });
});

describe("事実票の数字と日付", () => {
  it.each(["5.6億枚", "16年連続", "12月27日"])("本文に「%s」があること", (w) => {
    expect(body).toContain(w);
  });

  it("出典 2 URL が本文にあること", () => {
    expect(body).toContain("https://www.post.japanpost.jp/newsrelease/pressrelease/282881137.html");
    expect(body).toContain("https://kumanichi.com/articles/2030915");
  });

  it("事実票にない「引受」の日付の記述がないこと", () => {
    expect(body).not.toMatch(/引受/);
  });
});

describe("UTM の例", () => {
  const rows = body.split("\n").filter((l) => l.startsWith("| utm_"));
  const pairs = rows.map((l) => {
    const c = l.split("|").map((s) => s.trim());
    return { name: c[1], value: c[2].replace(/`/g, "") };
  });

  it.each([
    ["utm_source", "nenga"],
    ["utm_medium", "print"],
    ["utm_campaign", "nenga_2027"],
    ["utm_content", "customer"],
    ["utm_content", "partner"],
  ])("%s の値の例に %s があること", (name, value) => {
    expect(pairs).toContainEqual({ name, value });
  });

  it("utm_medium の値が UTM_MEDIUM_VALUES に含まれること", () => {
    const medium = pairs.find((p) => p.name === "utm_medium")!;
    expect(UTM_MEDIUM_VALUES).toContain(medium.value);
  });

  it("値がすべて小文字・英数字・アンダースコアだけであること", () => {
    expect(pairs.length).toBe(5);
    for (const p of pairs) expect(p.value).toMatch(/^[a-z0-9_]+$/);
  });

  it("個人を見分ける値を付けない注意があること", () => {
    expect(body).toMatch(/一人ずつ/);
    expect(body).toMatch(/名前|顧客番号/);
  });
});

describe("QR の大きさ", () => {
  it("20mm と 30mm が flyer.mdx の印刷サイズの節と同じ値であること", () => {
    const flyer = fs.readFileSync(path.join(ROOT, "src/content/use-cases/flyer.mdx"), "utf-8");
    const min = flyer.match(/最小サイズ \| (\d+)mm/)?.[1];
    const rec = flyer.match(/推奨サイズ \| (\d+)mm/)?.[1];
    expect(min).toBe("20");
    expect(rec).toBe("30");
    expect(body).toContain(`最小${min}mm`);
    expect(body).toContain(`推奨${rec}mm`);
  });
});

describe("内部リンク", () => {
  it.each(["/create", "/guide/utm-parameters", "/use-cases/flyer", "/use-cases/business-card"])(
    "%s へのリンクがあり、リンク先が実在すること",
    (href) => {
      expect(body).toContain(`](${href})`);
      if (href === "/create") {
        expect(fs.existsSync(path.join(ROOT, "src/app/(ja)/(tool)/create/page.tsx"))).toBe(true);
      } else {
        const [section, slug] = href.slice(1).split("/");
        expect(fs.existsSync(path.join(ROOT, `src/content/${section}/${slug}.mdx`))).toBe(true);
      }
    },
  );
});

describe("表記", () => {
  it("ファイル全体に「—」「―」「–」がないこと", () => {
    expect(source).not.toMatch(DASH);
  });

  it("ファイル全体に絵文字がないこと", () => {
    expect(source).not.toMatch(EMOJI);
  });

  it("yomiyasu 基準 JSON に載っていないこと", () => {
    const baseline = fs.readFileSync(path.join(ROOT, "tests/fixtures/yomiyasu-baseline.json"), "utf-8");
    expect(baseline).not.toContain(SLUG);
  });
});

describe("事実票の全項目（固定文字列）", () => {
  it.each([
    "7.5億枚",
    "74.3%",
    "25.7%",
    "2026年11月2日",
    "2027年1月15日",
    "1月10日",
    "12月25日",
    "2026年用",
    "日本郵便",
    "共同通信",
  ])("本文に「%s」があること", (w) => {
    expect(body).toContain(w);
  });
});

describe("事実票にない数字の混入防止", () => {
  const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf-8");
  const flyer = read("src/content/use-cases/flyer.mdx");
  const card = read("src/content/use-cases/business-card.mdx");

  it("億・万を伴う数が 5.6億、7.5億 だけであること", () => {
    const found = Array.from(body.matchAll(/\d+(?:\.\d+)?\s*[億万]/g), (m) => m[0].replace(/\s/g, ""));
    expect(Array.from(new Set(found)).sort()).toEqual(["5.6億", "7.5億"]);
  });

  it("% の数値が 74.3% と 25.7% だけであること", () => {
    const found = Array.from(body.matchAll(/\d+(?:\.\d+)?\s*[%％]/g), (m) => m[0].replace(/\s/g, ""));
    expect(Array.from(new Set(found)).sort()).toEqual(["25.7%", "74.3%"]);
  });

  it.each(["アンケート", "調査によると", "調査では", "統計", "割の人", "回答"])("統計語「%s」がないこと", (w) => {
    expect(body).not.toContain(w);
  });

  it("mm の数値が許可リストと一致し、チラシ・名刺の記述から裏づけられること", () => {
    const allowed = new Set(["3", "15", "20", "30", "100", "148"]);
    const found = Array.from(new Set(Array.from(body.matchAll(/(\d+(?:\.\d+)?)\s*mm/g), (m) => m[1])));
    expect(found.filter((n) => !allowed.has(n))).toEqual([]);
    expect(found.sort()).toEqual(Array.from(allowed).sort());
    // チラシ: 最小20、推奨30、余白3
    expect(flyer).toMatch(/最小サイズ \| 20mm/);
    expect(flyer).toMatch(/推奨サイズ \| 30mm/);
    expect(flyer).toMatch(/周囲の余白 \| 最低3mm/);
    // 名刺: 最小15、推奨20
    expect(card).toMatch(/最小サイズ \| 15mm/);
    expect(card).toMatch(/推奨サイズ \| 20mm/);
    expect(body).toContain("15mmから20mm");
    // はがき 100mm x 148mm は flyer.mdx のはがきの記述と同じ
    expect(flyer).toContain("はがき（100mm × 148mm）");
    expect(body).toContain("100mm × 148mm");
    expect(body).toMatch(/3mm以上/);
  });
});

describe("記述と構成", () => {
  it("「宛名面」がなく、寒中見舞いと年賀状じまいに触れ、スマートフォンでの読み取り確認の注意があること", () => {
    expect(body).not.toContain("宛名面");
    expect(body).toContain("寒中見舞い");
    expect(body).toContain("年賀状じまい");
    expect(body).toMatch(/スマートフォンで読み取りを確かめ/);
  });

  it("参照先 guide/utm-parameters.mdx に「GA4で確認する手順」の見出しが実在すること", () => {
    const guide = fs.readFileSync(path.join(ROOT, "src/content/guide/utm-parameters.mdx"), "utf-8");
    expect(guide).toMatch(/^## GA4で確認する手順$/m);
    expect(body).toContain("「GA4で確認する手順」");
  });

  it("frontmatter の date が 2026-11-15、updated がなく、category が既存ブログで使われていること", () => {
    expect(String(parsed.data.date)).toBe("2026-11-15");
    expect(parsed.data.updated).toBeUndefined();
    const dir = path.join(ROOT, "src/content/blog");
    const others = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".mdx") && f !== `${SLUG}.mdx`)
      .map((f) => matter(fs.readFileSync(path.join(dir, f), "utf-8")).data.category);
    expect(others).toContain(parsed.data.category);
  });
});

describe("プリセットと UI 表記との整合", () => {
  it("UTM_MEDIUM_VALUES が qr と print を含み、記事の「プリセット（qrとprint）」と一致すること", () => {
    expect(UTM_MEDIUM_VALUES).toContain("qr");
    expect(UTM_MEDIUM_VALUES).toContain("print");
    expect(body).toContain("プリセット（qrとprint）");
  });

  it("utm_source のプリセットに nenga がなく、記事が「プリセットにありません」と述べていること", () => {
    expect(UTM_SOURCE_VALUES as readonly string[]).not.toContain("nenga");
    expect(body).toMatch(/年賀状向けの値はプリセットにありません/);
  });

  it("utm_content の UI ラベルが記事の引用と一致すること", () => {
    expect(body).toContain(`「${jaClient.utm.fieldLabels.content}」`);
  });
});

describe("一覧・sitemap・llms.txt への掲載", () => {
  it("getBlogSlugList と /blog 一覧（getAllBlogs）に載ること", () => {
    expect(getBlogSlugList()).toContain(SLUG);
    expect(getAllBlogs().some((b) => b.slug === SLUG)).toBe(true);
  });

  it("sitemap に載ること", () => {
    expect(sitemap().some((e) => new URL(e.url).pathname === PATH_URL)).toBe(true);
  });

  it("llms.txt に載ること", () => {
    expect(buildLlmsTxt()).toContain(PATH_URL);
  });
});
