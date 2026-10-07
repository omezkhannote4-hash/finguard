"use client";

import { useEffect, useState } from "react";
import { SIGNALS, type Analysis } from "@/lib/analysis";
import { WHAT_IF, WHAT_IF_QUESTIONS, type WhatIf } from "@/lib/what-if";
import { CheckIcon, ChevronDownIcon, CrossIcon } from "@/components/icons";

// Score bands: green < 30, yellow 30–59, orange 60–80, red > 80.
function toneFor(score: number) {
  if (score < 30) {
    return {
      stroke: "stroke-green-400",
      text: "text-green-400",
      badge: "bg-green-400/10 text-green-300 ring-green-400/30",
    };
  }
  if (score < 60) {
    return {
      stroke: "stroke-yellow-400",
      text: "text-yellow-400",
      badge: "bg-yellow-400/10 text-yellow-300 ring-yellow-400/30",
    };
  }
  if (score <= 80) {
    return {
      stroke: "stroke-orange-400",
      text: "text-orange-400",
      badge: "bg-orange-400/10 text-orange-300 ring-orange-400/30",
    };
  }
  return {
    stroke: "stroke-red-500",
    text: "text-red-400",
    badge: "bg-red-500/10 text-red-300 ring-red-500/30",
  };
}

type Tone = ReturnType<typeof toneFor>;

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function RiskMeter({ score, level, tone }: { score: number; level: string; tone: Tone }) {
  // Start empty and fill to the score on the next frames, so the ring animates in.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setShown(score));
    });
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div
      role="img"
      aria-label={`Risk score ${score} out of 100: ${level}`}
      className="relative h-36 w-36 shrink-0"
    >
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          className="stroke-neutral-800"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          strokeLinecap={shown > 0 ? "round" : "butt"}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - shown / 100)}
          className={`${tone.stroke} transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold tabular-nums ${tone.text}`}>{score}</span>
        <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          {level}
        </span>
      </div>
    </div>
  );
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Shows the message with every flagged phrase underlined in red, ignoring case.
// Phrases that don't appear in the message are simply skipped.
function HighlightedMessage({ text, phrases }: { text: string; phrases: string[] }) {
  const terms = phrases
    .map((phrase) => phrase.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length) // longest first, so it wins over a shorter overlap
    .map(escapeRegExp);
  // With one capture group, split() puts the matched phrases at the odd indexes.
  const parts = terms.length ? text.split(new RegExp(`(${terms.join("|")})`, "gi")) : [text];
  const found = parts.length > 1;

  return (
    <>
      <p className="whitespace-pre-wrap break-words rounded-xl bg-neutral-950/70 p-4 text-[15px] leading-relaxed text-neutral-300">
        {parts.map((part, i) =>
          i % 2 === 1 ? (
            <mark
              key={i}
              className="rounded-sm bg-red-500/15 text-red-100 underline decoration-red-500 decoration-2 underline-offset-4"
            >
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </p>
      <p className="mt-2 text-xs text-neutral-500">
        {found ? "Suspicious phrases are underlined in red." : "Nothing in this message was flagged."}
      </p>
    </>
  );
}

function Section({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`border-t border-neutral-800 px-5 py-5 sm:px-6 ${className}`}>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

function NumberedList({ items, accent = false }: { items: string[]; accent?: boolean }) {
  return (
    // role="list" keeps list semantics in Safari, which drops them when list-style is none.
    <ol role="list" className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-neutral-200">
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
              accent ? "bg-accent/15 text-accent" : "bg-neutral-800 text-neutral-300"
            }`}
          >
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

// Collapsible "what if" rows. Native <details>, so they open and close without JavaScript.
function WhatIfScenarios({ scenarios }: { scenarios: WhatIf }) {
  return (
    <div className="divide-y divide-neutral-800 overflow-hidden rounded-xl border border-neutral-800">
      {WHAT_IF_QUESTIONS.map(({ key, question }) => {
        const steps = scenarios[key];
        return (
          <details key={key} className="group">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[15px] font-medium text-neutral-100 transition-colors hover:bg-neutral-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
              {question}
              <ChevronDownIcon className="h-4 w-4 shrink-0 text-neutral-500 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
            </summary>
            {/* A chain of consequences; the last step, the outcome, is in red. */}
            <ol role="list" className="px-4 pb-4 pt-1">
              {steps.map((step, i) => {
                const outcome = i === steps.length - 1;
                return (
                  <li key={step} className="relative flex gap-3 pb-3 last:pb-0">
                    {!outcome && (
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-1 left-[5px] top-[18px] w-px -translate-x-1/2 bg-neutral-700"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                        outcome ? "bg-red-500" : "bg-neutral-600"
                      }`}
                    />
                    <span
                      className={`text-sm leading-relaxed ${
                        outcome ? "font-medium text-red-300" : "text-neutral-300"
                      }`}
                    >
                      {step}
                    </span>
                  </li>
                );
              })}
            </ol>
          </details>
        );
      })}
    </div>
  );
}

// The analysed message with its highlights, and the Scam DNA table.
function MessageDetails({ analysis, message }: { analysis: Analysis; message: string }) {
  const detected = new Set(analysis.dna.filter((d) => d.detected).map((d) => d.signal));

  return (
    <>
      <Section title="Your message">
        <HighlightedMessage text={message} phrases={analysis.flagged_phrases} />
      </Section>

      <Section title="Scam DNA">
        <table className="w-full text-sm">
          <thead className="sr-only">
            <tr>
              <th scope="col">Signal</th>
              <th scope="col">Detected?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/80">
            {SIGNALS.map((signal) => {
              const hit = detected.has(signal);
              return (
                <tr key={signal}>
                  <th
                    scope="row"
                    className={`py-2.5 pr-4 text-left font-normal ${hit ? "text-neutral-100" : "text-neutral-500"}`}
                  >
                    {signal}
                  </th>
                  <td className="py-2.5 text-right">
                    {hit ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-red-400">
                        <CheckIcon className="h-4 w-4" />
                        Detected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-neutral-500">
                        <CrossIcon className="h-4 w-4" />
                        Not found
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>
    </>
  );
}

// "payment" is the before-you-pay check: just the meter, why and action steps.
export default function ResultCard({
  analysis,
  message = "",
  variant = "message",
}: {
  analysis: Analysis;
  message?: string;
  variant?: "message" | "payment";
}) {
  const tone = toneFor(analysis.risk_score);
  const looksSafe = analysis.scam_type === "Not a scam";
  const whatIf = variant === "message" ? WHAT_IF[analysis.scam_type] : undefined;

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60">
      <div className="flex flex-col items-center gap-5 px-5 py-6 text-center sm:flex-row sm:px-6 sm:text-left">
        <div className="flex shrink-0 flex-col items-center">
          <RiskMeter score={analysis.risk_score} level={analysis.risk_level} tone={tone} />
          <p className="mt-2 whitespace-nowrap text-xs text-neutral-500">
            Risk estimate, not a certainty.
          </p>
        </div>
        <div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${tone.badge}`}
          >
            {analysis.scam_type}
          </span>
          <p className="mt-3 text-lg font-medium leading-snug text-neutral-100">{analysis.simple}</p>
        </div>
      </div>

      {variant === "message" && <MessageDetails analysis={analysis} message={message} />}

      {analysis.why.length > 0 && (
        <Section title={looksSafe ? "Why this looks safe" : "Why this is risky"}>
          <NumberedList items={analysis.why} />
        </Section>
      )}

      {analysis.action.length > 0 && (
        <Section title="What to do" className="bg-accent/[0.04]">
          <NumberedList items={analysis.action} accent />
        </Section>
      )}

      {whatIf && (
        <Section title="Scenario, not a prediction">
          <WhatIfScenarios scenarios={whatIf} />
        </Section>
      )}

      <p className="border-t border-neutral-800 px-5 py-4 text-xs leading-relaxed text-neutral-500 sm:px-6">
        {variant === "payment" ? (
          "Safety check only. FinGuard cannot see or stop your actual payment."
        ) : (
          <>
            This is an AI risk estimate, not a guarantee. If you&apos;re unsure, contact your bank
            through its official app or the number on your card.
          </>
        )}
      </p>
    </article>
  );
}
