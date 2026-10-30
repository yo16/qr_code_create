/**
 * @jest-environment node
 */
// 実データでの記事の lastModified: updated があれば updated、無ければ date
import sitemap from "@/app/sitemap";
import { NON_JA_LOCALES } from "@/i18n/locales";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";

const pathOf = (url: string) => new URL(url).pathname;
const lastModifiedOf = (p: string) => sitemap().find((e) => pathOf(e.url) === p)?.lastModified;

describe("sitemap の getting-started の lastModified（実データ）", () => {
  it.each(NON_JA_LOCALES)("%s は 2026-10-28 であること", (l) => {
    expect(lastModifiedOf(`${LOCALE_CONFIG[l].prefix}/guide/getting-started`)).toBe("2026-10-28");
  });

  it("ja は 2026-04-17 であること", () => {
    expect(lastModifiedOf("/guide/getting-started")).toBe("2026-04-17");
  });

  it("記事以外（/create）には lastModified が付かないこと", () => {
    const entry = sitemap().find((e) => pathOf(e.url) === "/create");
    expect(entry).toBeDefined();
    expect(entry).not.toHaveProperty("lastModified");
  });
});
