import sitemap from "@/app/sitemap";
import { buildLlmsTxt } from "@/lib/seo/llmsTxt";

// フラグ OFF（posterPage=false）のときの llms.txt。sitemap.flagOff.test.ts と同じモックの作り方
jest.mock("@/lib/constants/features", () => ({
  FEATURE_FLAGS: { posterPage: false },
}));

const content = buildLlmsTxt();
const urlsOf = (text: string): string[] => [...text.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]);

describe("llms.txt（フラグ OFF）", () => {
  it("/poster の URL が無いこと", () => {
    expect(urlsOf(content).filter((u) => new URL(u).pathname === "/poster")).toEqual([]);
  });

  it("## Features に Poster maker が無いこと", () => {
    const start = content.indexOf("## Features");
    expect(start).toBeGreaterThanOrEqual(0);
    const rest = content.slice(start);
    const features = rest.slice(0, rest.indexOf("\n## ", 1));
    expect(features).not.toContain("Poster maker");
    // 対照: ほかの機能は残っている
    expect(features).toContain("QR code generation");
  });

  it("Poster maker という語がどこにも無いこと", () => {
    expect(content).not.toContain("Poster maker");
  });

  it("llms.txt の URL 集合と sitemap の URL 集合が一致すること", () => {
    const llmsUrls = urlsOf(content);
    const sitemapUrls = sitemap().map((e) => e.url);
    expect(llmsUrls.filter((u) => !sitemapUrls.includes(u))).toEqual([]);
    expect(sitemapUrls.filter((u) => !llmsUrls.includes(u))).toEqual([]);
  });
});
