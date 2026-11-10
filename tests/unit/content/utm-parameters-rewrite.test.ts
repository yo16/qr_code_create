/**
 * @jest-environment node
 */
// qr_code_create-i9q（集客実験 E5b）: /guide/utm-parameters の書き直しを守る。
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { generateMetadata } from "@/app/(ja)/(marketing)/guide/[slug]/page";
import { jaClient } from "@/i18n/jaClient";
import sitemap from "@/app/sitemap";
import { UTM_SOURCE_VALUES, UTM_MEDIUM_VALUES, UTM_USAGE_EXAMPLE_VALUES } from "@/lib/constants/utmPresets";

jest.mock("next-mdx-remote/rsc", () => ({ MDXRemote: () => null }));
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("notFound called");
  }),
}));

const TITLE = "UTMパラメータとは？5種類の意味と値の付け方、GA4での確認手順";
const DESCRIPTION =
  "UTMパラメータはURLの末尾に付けて、アクセスの出どころをGoogle Analyticsに伝える目印です。5種類の意味、QRコードでの値の例、GA4での確認手順、よくある間違いをまとめました。";
const SITE_NAME = "QR Code Create";
const FILE = path.join(process.cwd(), "src/content/guide/utm-parameters.mdx");
const source = fs.readFileSync(FILE, "utf-8");
const parsed = matter(source);
const body = parsed.content;
const lines = body.split("\n");
const DASH = /[—―–]/;

function section(heading: string): string[] {
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (start === -1) return [];
  const rest = lines.slice(start + 1);
  const next = rest.findIndex((l) => l.startsWith("## "));
  return next === -1 ? rest : rest.slice(0, next);
}

describe("metadata", () => {
  it("title / og:title / description が新しい文で、サイト名が og に 1 回だけ付くこと", async () => {
    const m = await generateMetadata({ params: Promise.resolve({ slug: "utm-parameters" }) });
    expect(m.title).toBe(TITLE);
    expect(m.description).toBe(DESCRIPTION);
    expect(m.openGraph?.title).toBe(`${TITLE} | ${SITE_NAME}`);
    expect(String(m.openGraph?.title).split(SITE_NAME)).toHaveLength(2);
    expect(String(m.title)).not.toContain(SITE_NAME);
  });

  it("modifiedTime が 2026-11-10、publishedTime が 2026-04-10 であること", async () => {
    const m = await generateMetadata({ params: Promise.resolve({ slug: "utm-parameters" }) });
    expect(m.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-04-10",
      modifiedTime: "2026-11-10",
    });
  });

  it("frontmatter の updated が 2026-11-10 であること", () => {
    expect(String(parsed.data.updated)).toContain("2026-11-10");
  });
});

describe("sitemap の lastmod", () => {
  it("/guide/utm-parameters の lastModified が 2026-11-10 であること", () => {
    const entry = sitemap().find((e) => new URL(e.url).pathname === "/guide/utm-parameters");
    expect(entry?.lastModified).toBe("2026-11-10");
  });
});

describe("見出し構成", () => {
  const REQUIRED = [
    "UTMパラメータとは",
    "UTMパラメータの種類",
    "値の付け方の決まり",
    "よくある間違い",
    "GA4で確認する手順",
    "よくある質問",
  ];
  const h2 = lines.filter((l) => l.startsWith("## ")).map((l) => l.slice(3).trim());

  it("必須の h2 がすべて存在すること（他の節の検査が空になる原因の切り分け用）", () => {
    expect(REQUIRED.filter((h) => !h2.includes(h))).toEqual([]);
  });

  it("必須の h2 が相対順序を保って並ぶこと", () => {
    const idx = REQUIRED.map((h) => h2.indexOf(h));
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  });

  it("「値の付け方の決まり」に小文字と区切り文字の統一がある", () => {
    const t = section("値の付け方の決まり").join("\n");
    expect(t).toContain("小文字");
    expect(t).toMatch(/ハイフン|アンダースコア/);
  });

  it("「よくある間違い」に大文字小文字の混在で別に集計される旨がある", () => {
    const t = section("よくある間違い").join("\n");
    expect(t).toMatch(/大文字小文字/);
    expect(t).toMatch(/別の.*(表示|数え|集計)/);
  });

  it("冒頭の段落が URLの末尾 と GA4 に触れ、UI のスイッチ名が ja 辞書と一致すること", () => {
    const intro = section("UTMパラメータとは").join("\n").trim().split("\n\n")[0];
    expect(intro).toContain("URLの末尾");
    expect(intro).toMatch(/GA4|Google Analytics/);
    expect(jaClient.utm.toggleLabel).toBeTruthy();
    expect(body).toContain(`「${jaClient.utm.toggleLabel}」`);
  });

  it("description で約束した「GA4での確認手順」に当たる節が本文に実在し、中身があること", () => {
    expect(DESCRIPTION).toContain("GA4での確認手順");
    expect(TITLE).toContain("GA4での確認手順");
    const sec = section("GA4で確認する手順");
    expect(sec.join("\n").trim().length).toBeGreaterThan(100);
    expect(sec.some((l) => /^\d+\. /.test(l))).toBe(true);
  });
});

describe("種類の表", () => {
  const rows = section("UTMパラメータの種類").filter((l) => l.startsWith("| utm_"));
  const row = (name: string) => rows.find((l) => l.startsWith(`| ${name} |`)) ?? "";

  it("5 種類が行として並ぶこと", () => {
    expect(rows).toHaveLength(5);
  });

  it.each(["utm_source", "utm_medium", "utm_campaign"])("%s が「必須」であること", (name) => {
    expect(row(name).split("|")[2].trim()).toBe("必須");
  });

  it.each(["utm_content", "utm_term"])("%s が「任意」であること", (name) => {
    expect(row(name).split("|")[2].trim()).toBe("任意");
  });

  it("source・medium の例がプリセットの値と一致すること", () => {
    const sourceCell = row("utm_source");
    const mediumCell = row("utm_medium");
    for (const v of ["flyer", "business_card", "poster"]) {
      expect(UTM_SOURCE_VALUES).toContain(v);
      expect(sourceCell).toContain(`\`${v}\``);
    }
    for (const v of ["qr", "print"]) {
      expect(UTM_MEDIUM_VALUES).toContain(v);
      expect(mediumCell).toContain(`\`${v}\``);
    }
  });

  it("campaign の例が用途別プリセットの campaign と source の組み合わせで一致すること", () => {
    const cell = row("utm_campaign");
    for (const source of ["flyer", "business_card", "poster"]) {
      const ex = UTM_USAGE_EXAMPLE_VALUES.find((e) => e.source === source);
      expect(ex).toBeDefined();
      expect(cell).toContain(`\`${ex!.campaign}\``);
    }
  });

  it("設定例の URL がプリセットの flyer / qr / sale_2026 と一致すること", () => {
    const ex = UTM_USAGE_EXAMPLE_VALUES.find((e) => e.source === "flyer")!;
    expect(section("設定例").join("\n")).toContain(
      `utm_source=${ex.source}&utm_medium=${ex.medium}&utm_campaign=${ex.campaign}`,
    );
  });
});

describe("GA4 で確認する手順", () => {
  const sec = section("GA4で確認する手順");
  const steps = sec.filter((l) => /^\d+\. /.test(l));

  it("番号付きの手順が 1 から連番で並ぶこと", () => {
    expect(steps.length).toBeGreaterThanOrEqual(5);
    steps.forEach((l, i) => expect(l.startsWith(`${i + 1}. `)).toBe(true));
  });

  it("「レポート」「集客」「トラフィック獲得」「セッションの参照元 / メディア」「セッションのキャンペーン」が順に現れること", () => {
    const keys = ["「レポート」", "「集客」", "「トラフィック獲得」", "「セッションの参照元 / メディア」", "「セッションのキャンペーン」"];
    let from = 0;
    for (const k of keys) {
      const i = steps.findIndex((l, idx) => idx >= from && l.includes(k));
      expect(i).toBeGreaterThanOrEqual(0);
      from = i;
    }
  });
});

describe("よくある質問", () => {
  const faq = section("よくある質問");
  const h3Idx = faq.map((l, i) => (l.startsWith("### ") ? i : -1)).filter((i) => i >= 0);

  it("h3 が 3〜5 個あること", () => {
    expect(h3Idx.length).toBeGreaterThanOrEqual(3);
    expect(h3Idx.length).toBeLessThanOrEqual(5);
  });

  it("各 h3 の直後に空行を挟んで答えの段落があること", () => {
    h3Idx.forEach((i, n) => {
      const end = n + 1 < h3Idx.length ? h3Idx[n + 1] : faq.length;
      const answer = faq.slice(i + 1, end).join("\n").trim();
      expect(faq[i + 1].trim()).toBe("");
      expect(answer.length).toBeGreaterThan(10);
      expect(answer.startsWith("#")).toBe(false);
    });
  });
});

describe("リンク", () => {
  it("/create と /guide/utm-setup へのリンクがあり、/guide/utm-setup が実在すること", () => {
    expect(body).toContain("](/create)");
    expect(body).toContain("](/guide/utm-setup)");
    expect(fs.existsSync(path.join(process.cwd(), "src/content/guide/utm-setup.mdx"))).toBe(true);
  });
});

describe("表記と誇張の再発防止", () => {
  it("ファイル全体に「—」「―」「–」がないこと", () => {
    expect(source).not.toMatch(DASH);
  });

  it("「特別な設定をしなくても」がなく、GA4 が飛び先に必要な旨があること", () => {
    expect(source).not.toContain("特別な設定をしなくても");
    for (const w of ["必ず", "絶対", "誰でも", "完全に"]) expect(body).not.toContain(w);
    expect(body).toMatch(/すぐには表示されないことがあります/);
    expect(body).toMatch(/飛び先のサイトにGA4が入っている必要があります/);
  });

  it("yomiyasu 基準 JSON に戻っていないこと", () => {
    const baseline = fs.readFileSync(path.join(process.cwd(), "tests/fixtures/yomiyasu-baseline.json"), "utf-8");
    expect(baseline).not.toContain("guide/utm-parameters.mdx");
  });
});
