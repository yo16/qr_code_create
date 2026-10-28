export const LOCALES = ["ja", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export type NonJaLocale = Exclude<Locale, "ja">;
export const NON_JA_LOCALES = LOCALES.filter((l): l is NonJaLocale => l !== "ja");

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function isNonJaLocale(value: string): value is NonJaLocale {
  return (NON_JA_LOCALES as readonly string[]).includes(value);
}
