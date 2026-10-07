"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { ChevronDownIcon, GlobeIcon } from "@/components/icons";
import { LANGUAGES, type LanguageCode } from "@/lib/languages";

// `compact` always shows the short code, for headers with little room.
export default function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const current = LANGUAGES.find((option) => option.code === language) ?? LANGUAGES[0];

  return (
    <div className="relative inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/60 px-2.5 text-sm font-medium text-neutral-200 transition-colors hover:border-neutral-600 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent min-[360px]:px-3">
      <GlobeIcon className="h-4 w-4 shrink-0 text-neutral-400" />
      {/* A short code on phones keeps the header on one line. */}
      <span className={`uppercase ${compact ? "" : "sm:hidden"}`}>{current.code}</span>
      {!compact && <span className="hidden sm:inline">{current.name}</span>}
      <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
      {/* The real control: a native select stretched invisibly over the pill, so phones open their own picker. */}
      <select
        aria-label="Language for explanations"
        value={language}
        onChange={(event) => setLanguage(event.target.value as LanguageCode)}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
      >
        {LANGUAGES.map((option) => (
          <option key={option.code} value={option.code}>
            {option.code === "en" ? option.name : `${option.name} · ${option.label}`}
          </option>
        ))}
      </select>
    </div>
  );
}
