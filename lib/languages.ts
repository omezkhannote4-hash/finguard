// The languages FinGuard can explain results in. Shared by the header dropdown and the API routes.
// `speech` is the locale used for voice input in that language.
export const LANGUAGES = [
  { code: "en", name: "English", label: "English", speech: "en-IN" },
  { code: "hi", name: "Hindi", label: "हिन्दी", speech: "hi-IN" },
  { code: "kn", name: "Kannada", label: "ಕನ್ನಡ", speech: "kn-IN" },
  { code: "ml", name: "Malayalam", label: "മലയാളം", speech: "ml-IN" },
  { code: "ta", name: "Tamil", label: "தமிழ்", speech: "ta-IN" },
  { code: "te", name: "Telugu", label: "తెలుగు", speech: "te-IN" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

// The English name of a language code, falling back to English for anything unknown.
export function languageName(code: unknown): string {
  return LANGUAGES.find((language) => language.code === code)?.name ?? "English";
}

// The voice-input locale for a language code, e.g. "hi-IN".
export function speechLocale(code: LanguageCode): string {
  return LANGUAGES.find((language) => language.code === code)?.speech ?? "en-IN";
}
