/**
 * @jest-environment node
 */
// slug 検証（qr_code_create-xjj）。
// getGuide / getBlog / getUseCase は slug を /^[a-z0-9-]+$/ で検証し、合わなければファイルを見ずに null を返す。
// 目的: "../" による別ディレクトリの .mdx 読み取り（パストラバーサル）を防ぐ。
import fs from "fs";
import path from "path";
import { getGuide } from "@/lib/content/getGuide";
import { getBlog } from "@/lib/content/getBlog";
import { getUseCase } from "@/lib/content/getUseCase";

const CONTENT = path.join(process.cwd(), "src/content");

// 意図: 攻撃用 slug が「実在ファイルを指している」ことを前提にする。
// 実在しないと、検証が無くても null になってしまい、テストが無意味になる。
describe("前提: トラバーサル先の MDX が実在する", () => {
  it.each([
    "guide/utm-setup.mdx",
    "use-cases/poster.mdx",
    "blog/qr-code-expiration.mdx",
  ])("src/content/%s が存在する", (rel) => {
    expect(fs.existsSync(path.join(CONTENT, rel))).toBe(true);
  });
});

// 境界値の slug。どれも正規表現 /^[a-z0-9-]+$/ に合わないので null でなければならない。
const INVALID_SLUGS: Array<[string, string]> = [
  ["空文字", ""],
  ["大文字を含む", "Getting-Started"],
  ["/ を含む", "sub/getting-started"],
  [". を含む", "getting.started"],
  ["末尾が .mdx", "getting-started.mdx"],
  ["Windows 区切りの ..\\", "..\\guide\\utm-setup"],
  ["アンダースコアを含む", "getting_started"],
  ["空白を含む", "getting started"],
];

describe("getGuide の slug 検証", () => {
  // 意図: en の guide ディレクトリから ../../guide/utm-setup で ja の MDX を読めてはならない
  it("en: 実在する ja ガイドを指す ../ の slug は null", () => {
    expect(getGuide("../../guide/utm-setup", "en")).toBeNull();
  });

  // 意図: ja の guide から別コンテンツ種別（use-cases）の MDX を読めてはならない
  it("ja: 実在する use-cases を指す ../ の slug は null", () => {
    expect(getGuide("../use-cases/poster", "ja")).toBeNull();
  });

  it.each(INVALID_SLUGS)("ja: 不正な slug（%s）は null", (_label, slug) => {
    expect(getGuide(slug, "ja")).toBeNull();
  });

  it.each(INVALID_SLUGS)("en: 不正な slug（%s）は null", (_label, slug) => {
    expect(getGuide(slug, "en")).toBeNull();
  });

  // 回帰防止: 正当な slug は従来どおり読める
  it("正当な slug は読める（ja: utm-setup / getting-started、en: getting-started）", () => {
    expect(getGuide("utm-setup", "ja")?.slug).toBe("utm-setup");
    expect(getGuide("getting-started", "ja")?.slug).toBe("getting-started");
    expect(getGuide("getting-started", "en")?.slug).toBe("getting-started");
  });
});

describe("getBlog の slug 検証", () => {
  // 意図: blog から guide の MDX を読めてはならない
  it("実在する guide を指す ../ の slug は null", () => {
    expect(getBlog("../guide/utm-setup")).toBeNull();
  });

  it.each(INVALID_SLUGS)("不正な slug（%s）は null", (_label, slug) => {
    expect(getBlog(slug)).toBeNull();
  });

  it("正当な slug（qr-code-expiration）は読める", () => {
    expect(getBlog("qr-code-expiration")?.slug).toBe("qr-code-expiration");
  });
});

describe("getUseCase の slug 検証", () => {
  // 意図: use-cases から blog の MDX を読めてはならない
  it("実在する blog を指す ../ の slug は null", () => {
    expect(getUseCase("../blog/qr-code-expiration")).toBeNull();
  });

  it.each(INVALID_SLUGS)("不正な slug（%s）は null", (_label, slug) => {
    expect(getUseCase(slug)).toBeNull();
  });

  it("正当な slug（poster）は読める", () => {
    expect(getUseCase("poster")?.slug).toBe("poster");
  });
});
