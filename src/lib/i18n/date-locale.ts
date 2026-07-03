import { enUS, fr, arMA } from "date-fns/locale";
import type { Locale as DateFnsLocale } from "date-fns";
import type { Locale } from "./config";

// Arabic and Darija both use Moroccan-Arabic date formatting (ar-MA).
export function dateLocale(locale: Locale): DateFnsLocale {
  if (locale === "en") return enUS;
  if (locale === "fr") return fr;
  return arMA;
}
