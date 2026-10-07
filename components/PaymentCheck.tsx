"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import ResultCard from "@/components/ResultCard";
import ResultSkeleton from "@/components/ResultSkeleton";
import { Spinner } from "@/components/icons";
import type { Analysis } from "@/lib/analysis";

const QUESTIONS = [
  { key: "newRecipient", label: "Is this a new recipient?" },
  { key: "urgency", label: "Did someone create urgency?" },
  { key: "linkOrQr", label: "Was a link or QR involved?" },
] as const;

type QuestionKey = (typeof QUESTIONS)[number]["key"];
type Answers = Record<QuestionKey, "yes" | "no" | "">;

// Matches the limits enforced by /api/payment-check.
const MAX_AMOUNT = 1_000_000_000;
const MAX_REASON_LENGTH = 300;

// Accepts "25000", "25,000" or "₹ 25,000.50".
function parseAmount(text: string) {
  const cleaned = text.replace(/[₹,\s]/g, "");
  return /^\d+(\.\d{1,2})?$/.test(cleaned) ? Number(cleaned) : NaN;
}

export default function PaymentCheck() {
  const { language } = useLanguage();
  const [amount, setAmount] = useState("");
  const [answers, setAnswers] = useState<Answers>({ newRecipient: "", urgency: "", linkOrQr: "" });
  const [reason, setReason] = useState("");
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef<AbortController | null>(null);

  // On phones the result appears below the fold, so bring it into view.
  useEffect(() => {
    if (!result && !unavailable) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [result, unavailable]);

  // Changing any answer makes the last result stale: clear it and cancel a running check.
  function edited() {
    const running = inFlight.current;
    inFlight.current = null;
    running?.abort();
    setLoading(false);
    setResult(null);
    setUnavailable(false);
    setProblem("");
  }

  async function check(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    const rupees = parseAmount(amount);
    if (!(rupees > 0) || rupees > MAX_AMOUNT) {
      setProblem("Enter the amount in rupees, for example 25,000.");
      return;
    }
    if (QUESTIONS.some((question) => !answers[question.key])) {
      setProblem("Answer all three yes/no questions.");
      return;
    }

    const controller = new AbortController();
    inFlight.current = controller;
    setProblem("");
    setLoading(true);
    setResult(null);
    setUnavailable(false);

    let analysis: Analysis | null = null;
    try {
      const res = await fetch("/api/payment-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: rupees,
          newRecipient: answers.newRecipient === "yes",
          urgency: answers.urgency === "yes",
          linkOrQr: answers.linkOrQr === "yes",
          reason: reason.trim(),
          language,
        }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        analysis = data as Analysis;
      } else if (inFlight.current === controller) {
        console.warn(`Payment check failed (HTTP ${res.status}):`, data?.error);
      }
    } catch (err) {
      if (inFlight.current === controller) console.warn("Payment check failed:", err);
    }

    // An answer changed while this was running, so its result is stale.
    if (inFlight.current !== controller) return;
    inFlight.current = null;
    setLoading(false);
    if (analysis) setResult(analysis);
    else setUnavailable(true);
  }

  const fieldClass =
    "rounded-xl border border-neutral-800 bg-neutral-950/70 text-base text-neutral-100 transition-colors placeholder:text-neutral-500 focus:border-accent/60 focus:outline-none";

  return (
    <>
      <form
        onSubmit={check}
        noValidate
        className="mt-6 space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5"
      >
        <div>
          <label htmlFor="amount" className="text-sm font-medium text-neutral-300">
            Amount in rupees
          </label>
          <div className={`mt-2 flex h-12 items-center px-3 focus-within:border-accent/60 ${fieldClass}`}>
            <span aria-hidden="true" className="text-neutral-500">
              ₹
            </span>
            <input
              id="amount"
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                edited();
              }}
              placeholder="25,000"
              className="h-full min-w-0 flex-1 bg-transparent pl-2 text-base text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
            />
          </div>
        </div>

        {QUESTIONS.map((question) => (
          <fieldset key={question.key}>
            <legend className="text-sm font-medium text-neutral-300">{question.label}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["yes", "no"] as const).map((value) => (
                <label key={value} className="relative">
                  <input
                    type="radio"
                    name={question.key}
                    value={value}
                    checked={answers[question.key] === value}
                    onChange={() => {
                      setAnswers((current) => ({ ...current, [question.key]: value }));
                      edited();
                    }}
                    className="peer sr-only"
                  />
                  <span className="flex h-12 cursor-pointer items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950/70 text-base font-medium text-neutral-300 transition-colors hover:border-neutral-600 peer-checked:border-accent/60 peer-checked:bg-accent/10 peer-checked:text-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                    {value === "yes" ? "Yes" : "No"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <div>
          <label htmlFor="reason" className="text-sm font-medium text-neutral-300">
            Reason for payment <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <textarea
            id="reason"
            rows={3}
            maxLength={MAX_REASON_LENGTH}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              edited();
            }}
            placeholder="e.g. A ₹2,000 processing fee to release a loan"
            className={`mt-2 block w-full resize-y px-3 py-2.5 leading-relaxed ${fieldClass}`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-base font-semibold text-neutral-950 transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 ${
            loading ? "cursor-wait" : ""
          }`}
        >
          {loading ? (
            <>
              <Spinner className="h-5 w-5 motion-safe:animate-spin" />
              Checking…
            </>
          ) : (
            "Check this payment"
          )}
        </button>
        {problem && (
          <p role="status" className="text-center text-sm text-neutral-300">
            {problem}
          </p>
        )}
      </form>

      {/* scroll-mt clears the sticky header when the result scrolls into view. */}
      <div ref={resultRef} className="mt-8 scroll-mt-24">
        {loading && <ResultSkeleton />}
        {unavailable && (
          <p
            role="status"
            className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-300"
          >
            Couldn&apos;t run the safety check right now. If you&apos;re unsure, wait and don&apos;t
            pay yet.
          </p>
        )}
        {result && <ResultCard analysis={result} variant="payment" />}
      </div>
    </>
  );
}
