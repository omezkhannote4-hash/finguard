"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ArrowDownIcon, ArrowRightIcon, Spinner } from "@/components/icons";
import type { Analysis } from "@/lib/analysis";
import { WHAT_IF, WHAT_IF_ADVICE, WHAT_IF_CHIPS } from "@/lib/what-if";

type Severity = Analysis["risk_level"];
type Outcome = {
  scenario: string;
  steps: string[];
  severity: Severity;
  advice: string;
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

// "What if I…?" for the current result: one scenario at a time, worked out by Groq.
export default function WhatIfSimulator({ message, analysis }: { message: string; analysis: Analysis }) {
  const { language } = useLanguage();
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [failed, setFailed] = useState(false);

  async function simulate(text: string) {
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
          scenario: String(data.scenario ?? `What if I ${typed}?`),
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
    const chip = WHAT_IF_CHIPS.find((option) => option.text === typed);
    const saved = chip ? WHAT_IF[analysis.scam_type]?.[chip.key] : undefined;
    if (chip && saved) {
      setOutcome({
        scenario: `What if I ${chip.text}?`,
        steps: saved,
        severity: analysis.risk_level,
        advice: WHAT_IF_ADVICE[chip.key],
        alreadyActed: false,
        saved: true,
      });
    } else {
      setFailed(true);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    simulate(scenario);
  }

  const tone = outcome ? (TONES[outcome.severity] ?? TONES.MEDIUM) : null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {WHAT_IF_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            disabled={loading}
            onClick={() => {
              setScenario(chip.text);
              simulate(chip.text);
            }}
            className="inline-flex min-h-11 items-center rounded-full border border-neutral-800 bg-neutral-950/40 px-3.5 text-sm text-neutral-300 transition-colors hover:border-neutral-600 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {chip.text}
          </button>
        ))}
      </div>

      {/* On phones the button sits under the box, so the box gets the full width. */}
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="what-if" className="sr-only">
          What if I…?
        </label>
        <div className="flex h-12 w-full min-w-0 items-center rounded-xl border border-neutral-800 bg-neutral-950/70 pl-3 transition-colors focus-within:border-accent/60 sm:flex-1">
          <span aria-hidden="true" className="shrink-0 text-base text-neutral-500">
            What if I
          </span>
          <input
            id="what-if"
            type="text"
            value={scenario}
            onChange={(event) => setScenario(event.target.value)}
            maxLength={MAX_SCENARIO_LENGTH}
            placeholder="already paid?"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-base text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !scenario.trim()}
          className={`flex h-12 w-full shrink-0 items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold sm:w-auto text-neutral-950 transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 ${
            loading ? "cursor-wait" : "disabled:cursor-not-allowed disabled:opacity-40"
          }`}
        >
          {loading ? <Spinner className="h-5 w-5 motion-safe:animate-spin" /> : "Simulate"}
          {loading && <span className="sr-only">Simulating…</span>}
        </button>
      </form>

      <div aria-live="polite">
        {loading && <p className="mt-4 text-sm text-neutral-400">Working out what could happen…</p>}
        {failed && (
          <p className="mt-4 text-sm text-neutral-300">
            Couldn&apos;t run this scenario right now. Try again in a moment.
          </p>
        )}
        {outcome && tone && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-neutral-100">{outcome.scenario}</p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone.badge}`}
              >
                Severity: {outcome.severity}
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
                <span className="font-semibold text-neutral-100">What to do now:</span>{" "}
                {outcome.advice}
              </p>
              {outcome.alreadyActed && (
                <Link
                  href="/emergency"
                  className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  Open the emergency steps
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              )}
            </div>
            {outcome.saved && (
              <p className="mt-2 text-xs text-neutral-500">
                The live scenario wasn&apos;t available, so this is a saved example.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
