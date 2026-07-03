// i18n configuration — shared by server and client (no server-only imports here).

export const locales = ["en", "fr", "ar", "ary"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Text direction per locale. Arabic and Darija (Arabic script) are RTL. */
export const localeDir: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  fr: "ltr",
  ar: "rtl",
  ary: "rtl",
};

/** Native display names for the language switcher. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
  ary: "الدارجة",
};

/** Cookie that holds the active locale (mirrors the per-user DB preference). */
export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function localeDirOf(locale: Locale): "ltr" | "rtl" {
  return localeDir[locale];
}
