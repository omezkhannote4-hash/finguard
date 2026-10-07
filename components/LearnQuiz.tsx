"use client";

import { useState } from "react";
import { useT } from "@/components/LanguageProvider";
import { CheckIcon, CrossIcon } from "@/components/icons";
import { OPTIONS, SCENARIOS } from "@/lib/learn";

// Each scenario locks after one choice and reveals why. React state only.
export default function LearnQuiz() {
  const t = useT();
  const [choices, setChoices] = useState<Record<string, number>>({});
  const answered = Object.keys(choices).length;
  const safeCount = SCENARIOS.filter((s) => choices[s.id] === s.safe).length;

  return (
    <>
      <ol role="list" className="mt-8 space-y-6">
        {SCENARIOS.map((scenario, index) => {
          const chosen = choices[scenario.id];
          const done = chosen !== undefined;
          const safeChoice = done && chosen === scenario.safe;

          return (
            <li
              key={scenario.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5"
            >
              <h2 className="text-xs font-semibold uppercase tracking-widest text-accent">
                {t("learn.scenario", { n: index + 1, topic: t(`learn.${scenario.id}.topic`) })}
              </h2>
              <p className="mt-3 text-xs text-neutral-500">{t(`learn.${scenario.id}.from`)}</p>
              <p className="mt-1.5 whitespace-pre-wrap break-words rounded-xl bg-neutral-950/70 p-4 text-[15px] leading-relaxed text-neutral-200">
                {t(`learn.${scenario.id}.message`)}
              </p>

              <h3 className="mt-5 font-semibold text-neutral-100">{t("learn.question")}</h3>
              <div role="group" aria-label={t("learn.options", { n: index + 1 })} className="mt-3 space-y-2">
                {OPTIONS.map((option, i) => {
                  const safe = i === scenario.safe;
                  const picked = chosen === i;
                  const tone =
                    done && safe
                      ? "border-green-500/50 bg-green-500/10 text-green-100"
                      : picked
                        ? "border-red-500/50 bg-red-500/10 text-red-100"
                        : done
                          ? "border-neutral-800 bg-neutral-950/40 text-neutral-500"
                          : "border-neutral-800 bg-neutral-950/40 text-neutral-200 hover:border-neutral-600";
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={done}
                      aria-pressed={picked}
                      onClick={() => setChoices((current) => ({ ...current, [scenario.id]: i }))}
                      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default ${tone}`}
                    >
                      <span aria-hidden="true" className="mt-px flex h-5 w-5 shrink-0 items-center justify-center">
                        {done && safe ? (
                          <CheckIcon className="h-5 w-5 text-green-400" />
                        ) : picked ? (
                          <CrossIcon className="h-5 w-5 text-red-400" />
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-neutral-600" />
                        )}
                      </span>
                      <span className="min-w-0 break-words">{t(`learn.${scenario.id}.${option}`)}</span>
                    </button>
                  );
                })}
              </div>

              <div aria-live="polite">
                {done && (
                  <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950/70 p-4">
                    <p className={`font-semibold ${safeChoice ? "text-green-400" : "text-red-400"}`}>
                      {t(safeChoice ? "learn.safe" : "learn.notQuite")}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-300">
                      {t(`learn.${scenario.id}.explanation`)}
                    </p>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {answered === SCENARIOS.length && (
        <div className="mt-6 rounded-2xl border border-accent/40 bg-accent/[0.06] p-4 text-center">
          <p className="font-semibold text-neutral-100">
            {t("learn.score", { safe: safeCount, total: SCENARIOS.length })}
          </p>
          <button
            type="button"
            onClick={() => setChoices({})}
            className="mt-2 inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-accent transition-colors hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {t("learn.again")}
          </button>
        </div>
      )}
    </>
  );
}
