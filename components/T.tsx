"use client";

import { useT } from "@/components/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n";

// Interface text that follows the language selector, for use inside server components.
export default function T({ k, vars }: { k: TranslationKey; vars?: Record<string, string | number> }) {
  const t = useT();
  return <>{t(k, vars)}</>;
}
