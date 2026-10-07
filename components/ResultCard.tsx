"use client";

import { useEffect, useState } from "react";
import { SIGNALS, type Analysis } from "@/lib/analysis";
import { useT } from "@/components/LanguageProvider";
import WhatIfSimulator from "@/components/WhatIfSimulator";
import { CheckIcon, CrossIcon } from "@/components/icons";
import { LEVEL_KEYS, SCAM_KEYS, SIGNAL_KEYS } from "@/lib/i18n";

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

function RiskMeter({
  score,
  level,
  label,
  tone,
}: {
  score: number;
  level: string;
  label: string;
  tone: Tone;
}) {
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
      aria-label={label}
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
  const t = useT();
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
        {found ? t("result.flagged") : t("result.nothingFlagged")}
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

// The analysed message with its highlights, and the Scam DNA table.
function MessageDetails({ analysis, message }: { analysis: Analysis; message: string }) {
  const t = useT();
  const detected = new Set(analysis.dna.filter((d) => d.detected).map((d) => d.signal));

  return (
    <>
      <Section title={t("result.yourMessage")}>
        <HighlightedMessage text={message} phrases={analysis.flagged_phrases} />
      </Section>

      <Section title={t("result.scamDna")}>
        <table className="w-full text-sm">
          <thead className="sr-only">
            <tr>
              <th scope="col">{t("result.signal")}</th>
              <th scope="col">{t("result.detectedQuestion")}</th>
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
                    {t(SIGNAL_KEYS[signal])}
                  </th>
                  <td className="py-2.5 text-right">
                    {hit ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-red-400">
                        <CheckIcon className="h-4 w-4 shrink-0" />
                        {t("result.detected")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-neutral-500">
                        <CrossIcon className="h-4 w-4 shrink-0" />
                        {t("result.notFound")}
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
  const t = useT();
  const tone = toneFor(analysis.risk_score);
  const looksSafe = analysis.scam_type === "Not a scam";
  const level = t(LEVEL_KEYS[analysis.risk_level]);

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60">
      <div className="flex flex-col items-center gap-5 px-5 py-6 text-center sm:flex-row sm:px-6 sm:text-left">
        <div className="flex shrink-0 flex-col items-center">
          <RiskMeter
            score={analysis.risk_score}
            level={level}
            label={t("result.meterLabel", { score: analysis.risk_score, level })}
            tone={tone}
          />
          <p className="mt-2 max-w-[16rem] text-center text-xs text-neutral-500">
            {t("result.riskEstimate")}
          </p>
        </div>
        <div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${tone.badge}`}
          >
            {t(SCAM_KEYS[analysis.scam_type])}
          </span>
          <p className="mt-3 text-lg font-medium leading-snug text-neutral-100">{analysis.simple}</p>
        </div>
      </div>

      {variant === "message" && <MessageDetails analysis={analysis} message={message} />}

      {analysis.why.length > 0 && (
        <Section title={looksSafe ? t("result.whySafe") : t("result.whyRisky")}>
          <NumberedList items={analysis.why} />
        </Section>
      )}

      {analysis.action.length > 0 && (
        <Section title={t("result.whatToDo")} className="bg-accent/[0.04]">
          <NumberedList items={analysis.action} accent />
        </Section>
      )}

      {variant === "message" && (
        <Section title={t("result.scenarioLabel")}>
          <WhatIfSimulator message={message} analysis={analysis} />
        </Section>
      )}

      <p className="border-t border-neutral-800 px-5 py-4 text-xs leading-relaxed text-neutral-500 sm:px-6">
        {variant === "payment" ? t("result.paymentDisclaimer") : t("result.disclaimer")}
      </p>
    </article>
  );
}
