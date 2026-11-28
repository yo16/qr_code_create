/**
 * @jest-environment node
 */
// qr_code_create-cnv（集客実験 E9）: ブログ「偽のQRコードと間違われないために、QRコードを置く側ができること」
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { generateMetadata } from "@/app/(ja)/(marketing)/blog/[slug]/page";
import sitemap from "@/app/sitemap";
import { getAllBlogs } from "@/lib/content/getAllBlogs";
import { getBlog, getBlogSlugList } from "@/lib/content/getBlog";
import { buildLlmsTxt } from "@/lib/seo/llmsTxt";

jest.mock("next-mdx-remote/rsc", () => ({ MDXRemote: () => null }));
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("notFound called");
  }),
}));

const SLUG = "qr-code-tampering-prevention";
const PATH_URL = `/blog/${SLUG}`;
const TITLE = "偽のQRコードと間違われないために、QRコードを置く側ができること";
const SITE_NAME = "QR Code Create";
const ROOT = process.cwd();
const FILE = path.join(ROOT, `src/content/blog/${SLUG}.mdx`);
const source = fs.readFileSync(FILE, "utf-8");
const parsed = matter(source);
const body = parsed.content;
const DASH = /[—―–]/;
const EMOJI = /\p{Extended_Pictographic}/u;

const KEISHICHO_URL = "https://www.keishicho.metro.tokyo.lg.jp/kurashi/cyber/notes/qrcord.html";
const SAITAMA_URL = "https://www.police.pref.saitama.lg.jp/documents/33461/nijigen-code-kigyou.pdf";

/** "## 見出し" から次の "## " の手前までを返す */
function section(heading: string): string {
  const lines = body.split("\n");
  const start = lines.findIndex((l) => l === `## ${heading}`);
  if (start < 0) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith("## "));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n");
}

/** 節の中の表の本文行（見出し行と区切り行を除く）をセルの配列にして返す */
function tableRows(text: string): string[][] {
  return text
    .split("\n")
    .filter((l) => l.startsWith("|"))
    .slice(2)
    .map((l) =>
      l
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim()),
    );
}

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

  it("og:type が article、publishedTime が 2026-11-28 であること", async () => {
    const m = await generateMetadata({ params: Promise.resolve({ slug: SLUG }) });
    expect(m.openGraph).toMatchObject({ type: "article", publishedTime: "2026-11-28" });
  });
});

describe("frontmatter", () => {
  it("date が 2026-11-28 で、updated がないこと", () => {
    expect(String(parsed.data.date)).toBe("2026-11-28");
    expect(parsed.data.updated).toBeUndefined();
  });

  it("title が題どおりで、category が既存のブログで使われていること", () => {
    expect(parsed.data.title).toBe(TITLE);
    const dir = path.join(ROOT, "src/content/blog");
    const others = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".mdx") && f !== `${SLUG}.mdx`)
      .map((f) => matter(fs.readFileSync(path.join(dir, f), "utf-8")).data.category);
    expect(parsed.data.category).toBe("qr-marketing");
    expect(others).toContain(parsed.data.category);
  });
});

describe("事実の固定: 警視庁", () => {
  const police = section("警視庁が挙げる貼り替えの手口");

  it("資料の題、更新日、URL が出典の節にあること", () => {
    const src = section("出典");
    expect(src).toContain("警視庁「QRコードを利用する時の注意点」");
    expect(src).toContain("更新日 2026年7月10日");
    expect(src).toContain(KEISHICHO_URL);
  });

  it("手口が 3 つ（フィッシング、送られたコードを読み取らせる、貼り替え）挙げられていること", () => {
    expect(police).toContain("QRコードを悪用した手口を3つ挙げています");
    expect(police).toContain("偽のメール（フィッシング）によるQRコード詐欺");
    expect(police).toContain("犯人側から送ったQRコードを読み取らせる手口");
    expect(police).toContain("QRコードの貼り替え");
  });

  it("貼り替えは、正規のコードの上に偽物のシールを貼り、偽の決済画面へ移動させる手口とされていること", () => {
    expect(police).toContain("フードコート");
    expect(police).toContain("正規のQRコードの上に偽物のシールを貼る");
    expect(police).toContain("偽の決済画面");
    expect(police).toContain("クレジットカード情報");
  });

  it("利用者向けの対策 3 つ（触る、店員に確認、表示内容を確認）と、置く側の記述がないことが書かれていること", () => {
    expect(police).toContain("読み取る前に指で触ってみること");
    expect(police).toContain("不審に思ったら店員に確認すること");
    expect(police).toContain("読み込んだあとに表示された内容を確認すること");
    expect(police).toContain("置く側に向けた記述はありません");
  });
});

describe("事実の固定: 埼玉県警察", () => {
  const saitama = section("公的機関が置く側に勧めていること");

  it("資料の題、2025年7月、発行元、URL が出典の節にあること", () => {
    const src = section("出典");
    expect(src).toContain("埼玉県警察 サイバーセキュリティレポート R7.7");
    expect(src).toContain("〔企業・団体向け対策のご紹介〕二次元コードを悪用したトラブル対策！");
    expect(src).toContain("（2025年7月）");
    expect(src).toContain(SAITAMA_URL);
  });

  it("本文で「二次元コード」の語と、QRコードとの対応を説明していること", () => {
    expect(saitama).toContain("二次元コード");
    expect(saitama).toContain("この記事でいうQRコードのこと");
    expect(saitama).toContain("3つの手口が載っています");
  });

  it("部署名を作らず「埼玉県警察」とだけ書いていること", () => {
    expect(body).not.toMatch(/埼玉県警察(?:本部)?(?:サイバー|生活安全|刑事)/);
    expect(body).not.toContain("S.P.P");
  });

  it("3 つの手口の表があり、手口と対策が資料どおりであること", () => {
    const rows = tableRows(saitama);
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.length === 3)).toBe(true);
    expect(rows.map((r) => r[0])).toEqual([
      "他人の二次元コードによる不正支払い",
      "利用客に偽の二次元コードを読み込ませる",
      "偽の決済完了画面を提示する",
    ]);
    expect(rows.map((r) => r[2])).toEqual([
      "提示された画面が静止画でないかを確認する",
      "レジカウンターに置いたままにしない",
      "支払い状況を管理、確認できる環境をつくる",
    ]);
    expect(rows[0][1]).toContain("スクリーンショット");
    expect(rows[1][1]).toContain("別のコードのシールが貼られ");
    expect(rows[1][1]).toContain("別の口座");
    expect(rows[2][1]).toContain("支払ったように装う");
  });

  it("貼り替えに当たるのは 2 つ目の手口で、1 つ目と 3 つ目は決済の話として触れるだけであること", () => {
    expect(saitama).toContain("貼り替えに当たるのは、2つ目の手口です");
    expect(saitama).toContain("1つ目と3つ目は決済の話なので、ここでは触れるだけにします");
  });
});

describe("出典の節", () => {
  it("2 つの URL が箇条書きで載っていること", () => {
    const items = section("出典")
      .split("\n")
      .filter((l) => l.startsWith("- "));
    expect(items).toHaveLength(2);
    expect(items[0]).toContain(KEISHICHO_URL);
    expect(items[1]).toContain(SAITAMA_URL);
    const urls = Array.from(body.matchAll(/https?:\/\/[^\s)）]+/g), (m) => m[0]);
    expect(Array.from(new Set(urls)).sort()).toEqual([KEISHICHO_URL, SAITAMA_URL].sort());
  });

  it("最後の節が「出典」であること", () => {
    const headings = body.split("\n").filter((l) => l.startsWith("## "));
    expect(headings[headings.length - 1]).toBe("## 出典");
  });
});

describe("書かないことの検査", () => {
  it("被害の件数・割合などの統計らしい記述がないこと", () => {
    expect(body).not.toMatch(/\d+(?:\.\d+)?\s*(?:件|[%％]|割|億|万)/);
    expect(body).not.toMatch(/[一二三四五六七八九十]割/);
    expect(body).not.toMatch(/被害(?:件数|額|総額|者数)/);
    expect(body).not.toMatch(/(?:調査|統計|アンケート|白書)/);
  });

  it.each(["IPA", "情報処理推進機構", "国民生活センター", "消費者庁", "FBI", "警察庁", "金融庁"])(
    "事実票にない機関「%s」の名前がないこと",
    (name) => {
      expect(source).not.toContain(name);
    },
  );

  it("電話番号や相談窓口の番号がないこと", () => {
    expect(body).not.toMatch(/0\d{1,4}[-ー(（]\d{1,4}[-ー)）]\d{3,4}/);
    expect(body).not.toMatch(/#\s?9110|＃9110|\b110番|\b188\b|0120/);
    expect(body).not.toMatch(/tel:/i);
  });

  it("ファイル全体に「—」「―」「–」がないこと", () => {
    expect(source).not.toMatch(DASH);
  });

  it("ファイル全体に絵文字がないこと", () => {
    expect(source).not.toMatch(EMOJI);
  });

  it.each(["防げます", "安全です", "これで防げ", "確実に防", "完全に防", "絶対に"])(
    "言い切りの語句「%s」がないこと",
    (w) => {
      expect(source).not.toContain(w);
    },
  );

  it("被害を防げると言い切れない旨の断りがあること", () => {
    expect(body).toContain("被害を防げると言い切ることはできません");
    expect(body).toContain("貼り替えをしにくくし、気づきやすくするためのものです");
  });

  it("yomiyasu 基準 JSON に載っていないこと", () => {
    const baseline = fs.readFileSync(path.join(ROOT, "tests/fixtures/yomiyasu-baseline.json"), "utf-8");
    expect(baseline).not.toContain(SLUG);
  });
});

describe("警察の勧めとサイトの提案の区別", () => {
  it("「ここからは、このサイトの提案」の節があり、警察の勧めではないと断っていること", () => {
    const s = section("ここからは、このサイトの提案");
    expect(s).not.toBe("");
    expect(s).toContain("次の節からは警察の勧めではありません");
    expect(s).toContain("効果を確かめた方法ではない");
  });

  it("警察の勧めの節が、提案の節より前にあること", () => {
    const police = body.indexOf("## 公的機関が置く側に勧めていること");
    const own = body.indexOf("## ここからは、このサイトの提案");
    const first = body.indexOf("## 貼り替えをしにくくする");
    expect(police).toBeGreaterThan(-1);
    expect(own).toBeGreaterThan(police);
    expect(first).toBeGreaterThan(own);
  });

  it("まとめの表で、埼玉県警察の行が「レジカウンターに置いたままにしない」の 1 行だけで、ほかはすべて「このサイトの提案」であること", () => {
    const rows = tableRows(section("対策のまとめ"));
    expect(rows).toHaveLength(6);
    expect(rows.every((r) => r.length === 2)).toBe(true);
    const saitama = rows.filter((r) => r[1] === "埼玉県警察");
    expect(saitama).toEqual([["QRコードをレジカウンターに置いたままにしない", "埼玉県警察"]]);
    const own = rows.filter((r) => r[1] !== "埼玉県警察");
    expect(own).toHaveLength(5);
    for (const r of own) expect(r[1]).toBe("このサイトの提案");
    // 警視庁の行はない（警視庁は置く側の対策を挙げていない）
    expect(rows.some((r) => r[1].includes("警視庁"))).toBe(false);
  });

  it("警視庁の勧めは、いつも利用者への勧めとして書かれていること（置く側への勧めにしていない）", () => {
    const lines = body.split("\n").filter((l) => l.includes("警視庁") && l.includes("勧め"));
    expect(lines.length).toBeGreaterThanOrEqual(2);
    for (const l of lines) expect(l).toContain("利用者");
    expect(section("警視庁が挙げる貼り替えの手口")).not.toContain("QR Code Create");
  });

  it("帰属の 2 文（警視庁は利用者への勧め、レジの件は埼玉県警察の勧めと同じ考え方）が固定されていること", () => {
    expect(body).toContain("警視庁が利用者に勧める、触ってみる確認");
    expect(body).toContain("レジに置いたままにしないという埼玉県警察の勧めと、同じ考え方です");
  });

  it.each(["短縮URLを使わず、自分のドメインを直接書き込む", "置いたQRコードを点検する"])(
    "「%s」の節に警察の名前が出ないこと（このサイトの提案を警察の勧めに見せない）",
    (h) => {
      const s = section(h);
      expect(s).not.toBe("");
      for (const w of ["警視庁", "埼玉県警察", "警察"]) expect(s).not.toContain(w);
    },
  );

  it("提案の各節が「ここからは、このサイトの提案」の節より後にあること", () => {
    const own = body.indexOf("## ここからは、このサイトの提案");
    expect(own).toBeGreaterThan(-1);
    for (const h of [
      "貼り替えをしにくくする",
      "利用者が確かめられるようにする",
      "短縮URLを使わず、自分のドメインを直接書き込む",
      "置いたQRコードを点検する",
      "貼り替えを見つけたとき",
    ]) {
      expect(body.indexOf(`## ${h}`)).toBeGreaterThan(own);
    }
  });
});

describe("決済用のコードは対象外", () => {
  it("守る対象が URL を開く QR コードで、決済用は決済サービスの案内に従うという断りがあること", () => {
    expect(body).toContain("URLを開くQRコード");
    expect(body).toContain("決済用のQRコードの置き方はお使いの決済サービスの案内に従ってください");
  });

  it("この断りが冒頭（最初の見出しより前）にあること", () => {
    const intro = body.slice(0, body.indexOf("\n## "));
    expect(intro).toContain("決済サービスの案内に従ってください");
  });
});

describe("このサイトの提案の内容", () => {
  it("印刷物に刷り込む、ケース・ラミネート、目と手の届く場所の 3 点があること", () => {
    const s = section("貼り替えをしにくくする");
    expect(s).toContain("印刷物にQRコードを刷り込みます");
    expect(s).toContain("ケースやラミネート");
    expect(s).toContain("目と手の届く場所");
    expect(s).toContain("貼られること自体は止められません");
  });

  it("QR のそばに店名、開く内容、飛び先のドメイン（example.com）を書くこと", () => {
    const s = section("利用者が確かめられるようにする");
    expect(s).toContain("店や会社の名前");
    expect(s).toContain("読み取ると何が開くか");
    expect(s).toContain("`example.com`");
    expect(s).toContain("どこにどのQRコードを置いたか");
  });

  it("短縮 URL を使わず自分のドメインを書き込む説明と、UTM でもドメインが変わらない旨があること", () => {
    const s = section("短縮URLを使わず、自分のドメインを直接書き込む");
    expect(s).toContain("静的QRコード");
    expect(s).toContain("URLをそのまま書き込む");
    expect(s).toContain("UTMパラメータを付けると、URLは長くなります。それでもドメインは変わりません");
  });

  it("点検の手順（一覧、触る、読み取る、置きっぱなしのものを優先）があること", () => {
    const s = section("置いたQRコードを点検する");
    expect(s).toContain("場所と飛び先");
    expect(s).toContain("1. 触ってみて、シールの段差がないかを見る");
    expect(s).toContain("2. 実際に読み取って、飛び先が正しいかを確かめる");
    expect(s).toContain("卓上、壁、看板");
  });

  it("貼り替えを見つけたときの 3 手順（使うのをやめる、写真、警察に相談）があること", () => {
    const s = section("貼り替えを見つけたとき");
    expect(s).toContain("使うのをやめ");
    expect(s).toContain("写真を残します");
    expect(s).toContain("警察に相談");
    expect(s).toContain("お客さまへの知らせ方");
  });
});

describe("内部リンク", () => {
  it.each(["/blog/qr-code-expiration", "/use-cases/store", "/use-cases/menu", "/use-cases/poster", "/create"])(
    "%s へのリンクがあり、リンク先が実在すること",
    (href) => {
      expect(body).toContain(`](${href})`);
      if (href === "/create") {
        expect(fs.existsSync(path.join(ROOT, "src/app/(ja)/(tool)/create/page.tsx"))).toBe(true);
      } else {
        const [section_, slug] = href.slice(1).split("/");
        expect(fs.existsSync(path.join(ROOT, `src/content/${section_}/${slug}.mdx`))).toBe(true);
      }
    },
  );

  it("本文中の内部リンクがすべて実在すること", () => {
    const hrefs = Array.from(body.matchAll(/\]\((\/[^)\s]*)\)/g), (m) => m[1]);
    expect(hrefs.length).toBeGreaterThanOrEqual(5);
    for (const href of hrefs) {
      if (href === "/create") continue;
      const [dir, slug] = href.slice(1).split("/");
      expect(fs.existsSync(path.join(ROOT, `src/content/${dir}/${slug}.mdx`))).toBe(true);
    }
  });

  it("qr-code-expiration の記事が静的 QR は URL をそのまま書き込むと説明しており、本記事と矛盾しないこと", () => {
    const exp = fs.readFileSync(path.join(ROOT, "src/content/blog/qr-code-expiration.mdx"), "utf-8");
    expect(exp).toContain("静的");
    expect(exp).toContain("動的");
    expect(body).toContain("[QRコードに有効期限はある？](/blog/qr-code-expiration)");
  });
});

describe("一覧・sitemap・llms.txt への掲載", () => {
  it("getBlogSlugList と /blog 一覧（getAllBlogs）に載ること", () => {
    expect(getBlogSlugList()).toContain(SLUG);
    const hit = getAllBlogs().find((b) => b.slug === SLUG);
    expect(hit).toBeDefined();
    expect(hit?.title).toBe(TITLE);
  });

  it("sitemap に載ること", () => {
    expect(sitemap().some((e) => new URL(e.url).pathname === PATH_URL)).toBe(true);
  });

  it("llms.txt に載ること", () => {
    expect(buildLlmsTxt()).toContain(PATH_URL);
  });
});

describe("異常系: slug の打ち間違い", () => {
  it("正しい slug は読め、打ち間違えた slug は null になること（記事の slug が変わると検出できる）", () => {
    expect(getBlog(SLUG)?.slug).toBe(SLUG);
    expect(getBlog("qr-code-tampering-preventio")).toBeNull();
    expect(getBlog("qr-code-tamper-prevention")).toBeNull();
  });

  it("打ち間違えた slug では generateMetadata が記事の題を返さないこと", async () => {
    const m = await generateMetadata({ params: Promise.resolve({ slug: "qr-code-tampering-preventio" }) });
    expect(m.title).toBeUndefined();
  });

  it("slug 打ち間違いの URL は sitemap にも一覧にもないこと", () => {
    expect(getBlogSlugList()).not.toContain("qr-code-tampering-preventio");
    expect(sitemap().some((e) => new URL(e.url).pathname === "/blog/qr-code-tampering-preventio")).toBe(false);
  });
});
