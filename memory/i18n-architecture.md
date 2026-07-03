---
name: i18n-architecture
description: How localization (English / French / Arabic / Moroccan Darija) works in the Barakah app
metadata:
  type: project
---

The app supports 4 locales: `en` (LTR), `fr` (French, LTR), `ar` (MSA, RTL), `ary` (Moroccan Darija in Arabic script, RTL). Locale code for Darija is the ISO 639-3 `ary`.

**Active-locale resolution:** cookie-based, no URL segment. Source of truth is the per-user `User.locale` DB column (added 2026-06-16 migration `add_user_locale`), mirrored to a `locale` cookie for flash-free SSR. `src/lib/i18n/server.ts#getLocale()` reads the cookie only. Login sets the cookie from the user's DB locale; **logout clears it** so a shared browser never leaks one account's language into another's (same class of fix as the dark-mode-per-user issue). `setLocale()` in `src/lib/i18n/actions.ts` writes both cookie + DB.

**Dictionaries:** `src/lib/i18n/dictionaries/{en,fr,ar,ary}.ts`. `en.ts` is canonical and its `typeof` defines the `Dictionary` type (NOT `as const` — that would force translations to equal the English literals). Server components call `getDictionary(locale)`; client components use `useDict()` / `useLocale()` from `src/components/i18n-provider.tsx` (dict is passed from root layout as a prop). Interpolate `{placeholder}` tokens with `fmt()` from `src/lib/i18n/interpolate.ts`. Seeded category names are translated via `tCategory(dict, name)`; user-entered data (account names, notes, household name) is never translated. Dates use date-fns `enUS` for en, `fr` for fr, and `ar-MA` for both ar and ary (`src/lib/i18n/date-locale.ts`).

RTL is handled by `dir` on `<html>` in the root layout plus Tailwind logical utilities (`ps-/pe-/ms-/me-/start-/end-`). Language switcher: `src/components/language-switcher.tsx` (in auth layout + dashboard sidebar/mobile header).
