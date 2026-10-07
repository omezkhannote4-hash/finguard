// The languages FinGuard can explain results in. Shared by the header dropdown and the API routes.
export const LANGUAGES = [
  { code: "en", name: "English", label: "English" },
  { code: "hi", name: "Hindi", label: "हिन्दी" },
  { code: "kn", name: "Kannada", label: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", label: "മലയാളം" },
  { code: "ta", name: "Tamil", label: "தமிழ்" },
  { code: "te", name: "Telugu", label: "తెలుగు" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

// The English name of a language code, falling back to English for anything unknown.
export function languageName(code: unknown): string {
  return LANGUAGES.find((language) => language.code === code)?.name ?? "English";
}
