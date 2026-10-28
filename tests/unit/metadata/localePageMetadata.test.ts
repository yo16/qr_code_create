import { NON_JA_LOCALES } from "@/i18n/locales";
import { localePath } from "@/lib/i18n/routes";
import { getLocalePageMetadata } from "@/lib/metadata/buildMetadata";

describe("getLocalePageMetadata", () => {
  it.each([...NON_JA_LOCALES])("%s の home の path が localePath と一致する", (locale) => {
    const { home } = getLocalePageMetadata(locale);
    expect(home.path).toBe(localePath(locale, "/"));
    expect(home.title.trim()).not.toBe("");
    expect(home.description.trim()).not.toBe("");
  });

  it.each([...NON_JA_LOCALES])("%s の create の path が localePath と一致する", (locale) => {
    const { create } = getLocalePageMetadata(locale);
    expect(create.path).toBe(localePath(locale, "/create"));
    expect(create.title.trim()).not.toBe("");
    expect(create.description.trim()).not.toBe("");
  });

  it("home と create は別のページとして区別できる", () => {
    const { home, create } = getLocalePageMetadata("en");
    expect(home.path).not.toBe(create.path);
    expect(home.title).not.toBe(create.title);
  });
});
