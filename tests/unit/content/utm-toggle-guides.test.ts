/**
 * @jest-environment node
 */
// qr_code_create-swm: UTM ON/OFF スイッチに合わせて更新した utm-parameters.mdx と utm-setup.mdx
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const NL = String.fromCharCode(10);
const read = (slug: string) =>
  matter(fs.readFileSync(path.join(process.cwd(), "src/content/guide", `${slug}.mdx`), "utf-8")).content;
const links = (text: string) => Array.from(text.matchAll(/\]\((\/[^)\s]*)/g), (m) => m[1]);
function section(body: string, heading: string): string {
  const start = body.indexOf(heading);
  if (start === -1) return "";
  const rest = body.slice(start + heading.length);
  const next = rest.indexOf(NL + "## ");
  return next === -1 ? rest : rest.slice(0, next);
}
const idx = (body: string, heading: string) => body.indexOf(NL + heading);

const { jaClient } = jest.requireActual("@/i18n/jaClient") as {
  jaClient: { utm: { toggleLabel: string } };
};
const TOGGLE = jaClient.utm.toggleLabel;

describe("utm-parameters.mdx の「UTMパラメータが不要なケース」", () => {
  const body = read("utm-parameters");
  const H = "## UTMパラメータが不要なケース";

  it("スイッチ名の前提: jaClient の toggleLabel が「UTMを設定する」であること", () => {
    expect(TOGGLE).toBe("UTMを設定する");
  });

  it("節が 1 つだけあり、「設定例」の後、「まとめ」の前にあること", () => {
    expect(body.split(NL + H).length - 1).toBe(1);
    expect(idx(body, "## 設定例")).toBeGreaterThanOrEqual(0);
    expect(idx(body, H)).toBeGreaterThan(idx(body, "## 設定例"));
    expect(idx(body, "## まとめ")).toBeGreaterThan(idx(body, H));
  });

  it("節に /create と /guide/utm-setup へのリンクがあり、スイッチ名が toggleLabel と一致すること", () => {
    const s = section(body, H);
    expect(links(s)).toEqual(expect.arrayContaining(["/create", "/guide/utm-setup"]));
    expect(s).toContain(`「${TOGGLE}」`);
  });

  it("まとめに、OFF にして UTM なしで作れる旨の 1 文があること", () => {
    expect(section(body, "## まとめ")).toContain("OFF");
  });
});

describe("utm-setup.mdx", () => {
  const body = read("utm-setup");

  it("「UTMパラメータセクションの開き方」が現状の UI の説明で、スイッチ名が toggleLabel と一致すること", () => {
    const s = section(body, "## UTMパラメータセクションの開き方");
    expect(s.length).toBeGreaterThan(0);
    expect(s).toContain(`「${TOGGLE}」`);
    expect(s).toContain("最初はON");
  });

  it("古い記述（クリックして展開、開閉する前提の表現）が残っていないこと", () => {
    expect(body).not.toContain("クリックして展開");
    expect(body).not.toContain("展開");
    expect(body).not.toContain("折りたたみ");
  });

  it("「UTMを使わない場合」が 1 つだけあり、「用途別の設定例」の後、「まとめ」の前にあること", () => {
    const H = "## UTMを使わない場合";
    expect(body.split(NL + H).length - 1).toBe(1);
    expect(idx(body, H)).toBeGreaterThan(idx(body, "## 用途別の設定例"));
    expect(idx(body, "## まとめ")).toBeGreaterThan(idx(body, H));
  });

  it("「UTMを使わない場合」にスイッチ名と /guide/utm-parameters へのリンクがあること", () => {
    const s = section(body, "## UTMを使わない場合");
    expect(s).toContain(`「${TOGGLE}」`);
    expect(links(s)).toContain("/guide/utm-parameters");
  });

  it("まとめに OFF の 1 文があり、/guide/utm-parameters の案内も残っていること", () => {
    const s = section(body, "## まとめ");
    expect(s).toContain("OFF");
    expect(s).toContain("UTMパラメータとは？初心者向け完全ガイド");
  });

  it("utm_term・utm_content の太字が `**utm_term**（…）` の形で、`**…（…）**` の形が残っていないこと", () => {
    expect(body).toContain("**utm_term**（検索キーワード）");
    expect(body).toContain("**utm_content**（コンテンツ識別子）");
    expect(body).not.toContain("**utm_term（検索キーワード）**");
    expect(body).not.toContain("**utm_content（コンテンツ識別子）**");
  });
});

describe("相互リンク", () => {
  it("utm-parameters と utm-setup が互いにリンクしていること", () => {
    expect(links(read("utm-parameters"))).toContain("/guide/utm-setup");
    expect(links(read("utm-setup"))).toContain("/guide/utm-parameters");
  });
});
