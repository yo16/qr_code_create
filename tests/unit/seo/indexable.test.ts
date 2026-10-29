import { NOINDEX_PATHS, isIndexedPath } from "@/lib/seo/indexable";
import { PAGE_METADATA } from "@/lib/metadata/buildMetadata";

describe("isIndexedPath", () => {
  it.each(["/privacy", "/terms"])("noindex の %s は false", (p) => {
    expect(isIndexedPath(p)).toBe(false);
  });

  it.each(["/", "", "/create", "/faq", "/guide/getting-started", "/en", "/en/create"])("%s は true", (p) => {
    expect(isIndexedPath(p)).toBe(true);
  });

  it("未知のパスは true（noindex に載っていないため）", () => {
    expect(isIndexedPath("/no-such-page")).toBe(true);
  });
});

describe("NOINDEX_PATHS", () => {
  it("PAGE_METADATA の noIndex のページと一致すること", () => {
    const expected = Object.values(PAGE_METADATA)
      .filter((p) => "noIndex" in p && p.noIndex === true)
      .map((p) => p.path)
      .sort();
    expect([...NOINDEX_PATHS].sort()).toEqual(expected);
    expect(expected).toEqual(["/privacy", "/terms"]);
  });
});

describe("isIndexedPath: PAGE_METADATA の home に noIndex を足した場合", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("@/lib/metadata/buildMetadata");
  });

  it("'' と '/' が false になること", () => {
    jest.resetModules();
    jest.doMock("@/lib/metadata/buildMetadata", () => {
      const actual = jest.requireActual<typeof import("@/lib/metadata/buildMetadata")>("@/lib/metadata/buildMetadata");
      return {
        ...actual,
        PAGE_METADATA: { ...actual.PAGE_METADATA, home: { ...actual.PAGE_METADATA.home, noIndex: true } },
      };
    });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@/lib/seo/indexable") as typeof import("@/lib/seo/indexable");
    expect(mod.isIndexedPath("")).toBe(false);
    expect(mod.isIndexedPath("/")).toBe(false);
    expect(mod.isIndexedPath("/create")).toBe(true);
  });
});
