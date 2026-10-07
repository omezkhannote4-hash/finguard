"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useLanguage, useT } from "@/components/LanguageProvider";
import { ArrowDownIcon, ArrowRightIcon, Spinner } from "@/components/icons";
import type { Analysis } from "@/lib/analysis";
import { LEVEL_KEYS, type TranslationKey } from "@/lib/i18n";
import { WHAT_IF, WHAT_IF_CHIPS, type WhatIfKey } from "@/lib/what-if";

type Severity = Analysis["risk_level"];
type Outcome = {
  scenario: string;
  steps: string[];
  severity: Severity;
  // Live advice comes back in the chosen language; a saved chain's advice is a translation key.
  advice: string;
  adviceKey?: TranslationKey;
  alreadyActed: boolean;
  saved?: boolean;
};

// Matches the limit enforced by /api/what-if.
const MAX_SCENARIO_LENGTH = 200;

// Same colours as the risk meter: green, yellow, orange, red.
const TONES: Record<Severity, { step: string; last: string; arrow: string; badge: string }> = {
  LOW: {
    step: "border-green-400/30 bg-green-400/[0.06]",
    last: "text-green-200",
    arrow: "text-green-400",
    badge: "bg-green-400/10 text-green-300 ring-green-400/30",
  },
  MEDIUM: {
    step: "border-yellow-400/30 bg-yellow-400/[0.06]",
    last: "text-yellow-200",
    arrow: "text-yellow-400",
    badge: "bg-yellow-400/10 text-yellow-300 ring-yellow-400/30",
  },
  HIGH: {
    step: "border-orange-400/30 bg-orange-400/[0.06]",
    last: "text-orange-200",
    arrow: "text-orange-400",
    badge: "bg-orange-400/10 text-orange-300 ring-orange-400/30",
  },
  CRITICAL: {
    step: "border-red-500/40 bg-red-500/[0.08]",
    last: "text-red-200",
    arrow: "text-red-400",
    badge: "bg-red-500/10 text-red-300 ring-red-500/30",
  },
};

// "What if I already paid?" and "already paid" both become "already paid", as on the server.
function cleanScenario(text: string) {
  return text
    .trim()
    .replace(/^what\s+if\s+/i, "")
    .replace(/^i\s+/i, "")
    .replace(/\?+$/, "")
    .trim();
}

// "What if I…?" for the current result: one scenario at a time, worked out by Groq.
export default function WhatIfSimulator({ message, analysis }: { message: string; analysis: Analysis }) {
  const { language } = useLanguage();
  const t = useT();
  const [scenario, setScenario] = useState("");
  // The suggestion chip whose text is in the box, until the user edits it.
  const [chip, setChip] = useState<WhatIfKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [failed, setFailed] = useState(false);

  async function simulate(text: string, chipKey: WhatIfKey | null) {
    const typed = text.trim();
    if (!typed || loading) return;

    setLoading(true);
    setFailed(false);
    setOutcome(null);
    try {
      const res = await fetch("/api/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, analysis, scenario: typed, language }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.steps) && typeof data?.advice === "string") {
        setOutcome({
          scenario: cleanScenario(typed),
          steps: data.steps.filter((step: unknown): step is string => typeof step === "string"),
          severity: data.severity,
          advice: data.advice,
          alreadyActed: Boolean(data.alreadyActed),
        });
        return;
      }
      console.warn(`What-if failed (HTTP ${res.status}):`, data?.error);
    } catch (err) {
      console.warn("What-if failed:", err);
    } finally {
      setLoading(false);
    }

    // A suggested scenario can fall back to the saved chain for this scam type.
    const saved = chipKey ? WHAT_IF[analysis.scam_type]?.[chipKey] : undefined;
    if (chipKey && saved) {
      setOutcome({
        scenario: cleanScenario(typed),
        steps: saved,
        severity: analysis.risk_level,
        advice: "",
        adviceKey: `whatif.advice.${chipKey}`,
        alreadyActed: false,
        saved: true,
      });
    } else {
      setFailed(true);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    simulate(scenario, chip);
  }

  const tone = outcome ? (TONES[outcome.severity] ?? TONES.MEDIUM) : null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {WHAT_IF_CHIPS.map((key) => {
          const label = t(`whatif.chip.${key}`);
          return (
            <button
              key={key}
              type="button"
              disabled={loading}
              onClick={() => {
                setScenario(label);
                setChip(key);
                simulate(label, key);
              }}
              className="inline-flex min-h-11 items-center rounded-full border border-neutral-800 bg-neutral-950/40 px-3.5 text-left text-sm text-neutral-300 transition-colors hover:border-neutral-600 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* On phones the button sits under the box, so the box gets the full width. */}
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="what-if" className="sr-only">
          {t("whatif.inputLabel")}
        </label>
        <div className="flex h-12 w-full min-w-0 items-center rounded-xl border border-neutral-800 bg-neutral-950/70 pl-3 transition-colors focus-within:border-accent/60 sm:flex-1">
          <span aria-hidden="true" className="shrink-0 text-base text-neutral-500">
            {t("whatif.prefix")}
          </span>
          <input
            id="what-if"
            type="text"
            value={scenario}
            onChange={(event) => {
              setScenario(event.target.value);
              setChip(null);
            }}
            maxLength={MAX_SCENARIO_LENGTH}
            placeholder={t("whatif.placeholder")}
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-base text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !scenario.trim()}
          className={`flex h-12 w-full shrink-0 items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-neutral-950 transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 sm:w-auto ${
            loading ? "cursor-wait" : "disabled:cursor-not-allowed disabled:opacity-40"
          }`}
        >
          {loading ? <Spinner className="h-5 w-5 motion-safe:animate-spin" /> : t("whatif.simulate")}
          {loading && <span className="sr-only">{t("whatif.simulating")}</span>}
        </button>
      </form>

      <div aria-live="polite">
        {loading && <p className="mt-4 text-sm text-neutral-400">{t("whatif.working")}</p>}
        {failed && <p className="mt-4 text-sm text-neutral-300">{t("whatif.failed")}</p>}
        {outcome && tone && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 break-words font-medium text-neutral-100">
                {t("whatif.title", { scenario: outcome.scenario })}
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone.badge}`}
              >
                {t("whatif.severity", { level: t(LEVEL_KEYS[outcome.severity] ?? "level.MEDIUM") })}
              </span>
            </div>
            <ol role="list" className="mt-3">
              {outcome.steps.map((step, i) => (
                <li key={i}>
                  {i > 0 && <ArrowDownIcon className={`mx-auto my-1 h-4 w-4 ${tone.arrow}`} />}
                  <p
                    className={`break-words rounded-xl border px-4 py-2.5 text-sm leading-relaxed ${tone.step} ${
                      i === outcome.steps.length - 1 ? `font-medium ${tone.last}` : "text-neutral-200"
                    }`}
                  >
                    {step}
                  </p>
                </li>
              ))}
            </ol>
            <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 text-sm leading-relaxed text-neutral-200">
              <p>
                <span className="font-semibold text-neutral-100">{t("whatif.whatToDoNow")}</span>{" "}
                {outcome.adviceKey ? t(outcome.adviceKey) : outcome.advice}
              </p>
              {outcome.alreadyActed && (
                <Link
                  href="/emergency"
                  className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  {t("whatif.openEmergency")}
                  <ArrowRightIcon className="h-4 w-4 shrink-0" />
                </Link>
              )}
            </div>
            {outcome.saved && <p className="mt-2 text-xs text-neutral-500">{t("whatif.savedNote")}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
