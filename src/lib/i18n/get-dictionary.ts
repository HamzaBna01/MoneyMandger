import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";

// Lazily load only the requested locale's dictionary. Called on the server
// (root layout / pages); the resolved object is passed to the client provider.
const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en").then((m) => m.en),
  fr: () => import("./dictionaries/fr").then((m) => m.fr),
  ar: () => import("./dictionaries/ar").then((m) => m.ar),
  ary: () => import("./dictionaries/ary").then((m) => m.ary),
};

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return (loaders[locale] ?? loaders.en)();
}

/** Translate a (possibly seeded) category name; custom names fall back as-is. */
export function tCategory(dict: Dictionary, name: string): string {
  return (dict.categories as Record<string, string>)[name] ?? name;
}
