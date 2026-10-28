import { LOCALES } from "@/i18n/locales";
import {
  buildRootMetadata,
  rootMetadataEn,
  rootMetadataJa,
} from "@/lib/metadata/rootMetadata";

describe("buildRootMetadata", () => {
  it("ja は rootMetadataJa と同じ値", () => {
    expect(buildRootMetadata("ja")).toEqual(rootMetadataJa);
  });

  it("en は rootMetadataEn と同じ値", () => {
    expect(buildRootMetadata("en")).toEqual(rootMetadataEn);
  });

  it.each([...LOCALES])("%s の title / description が空でない", (locale) => {
    const metadata = buildRootMetadata(locale);
    const title = metadata.title as { default: string; template: string };
    expect(title.default.trim()).not.toBe("");
    expect(title.template).toContain("%s");
    expect(String(metadata.description).trim()).not.toBe("");
    expect(metadata.metadataBase).toBeInstanceOf(URL);
  });

  it("ja と en で title が異なる", () => {
    const ja = buildRootMetadata("ja").title as { default: string };
    const en = buildRootMetadata("en").title as { default: string };
    expect(ja.default).not.toBe(en.default);
  });
});
