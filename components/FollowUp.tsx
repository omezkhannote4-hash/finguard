"use client";

import { useState, type FormEvent } from "react";
import { Spinner } from "@/components/icons";
import type { Analysis } from "@/lib/analysis";
import type { LanguageCode } from "@/lib/languages";

const MAX_QUESTION_LENGTH = 300;

// One question about the current result at a time; asking again replaces the last answer.
export default function FollowUp({
  message,
  analysis,
  language,
}: {
  message: string;
  analysis: Analysis;
  language: LanguageCode;
}) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const [answer, setAnswer] = useState("");
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function ask(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || loading) return;

    setAsked(text);
    setAnswer("");
    setFailed(false);
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, analysis, question: text, language }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && typeof data?.answer === "string" && data.answer.trim()) {
        setAnswer(data.answer.trim());
        setQuestion("");
      } else {
        console.warn(`Follow-up failed (HTTP ${res.status}):`, data?.error);
        setFailed(true);
      }
    } catch (err) {
      console.warn("Follow-up failed:", err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3">
      <form onSubmit={ask} className="flex gap-2">
        <label htmlFor="follow-up" className="sr-only">
          Ask about this result
        </label>
        <input
          id="follow-up"
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="Ask about this result"
          autoComplete="off"
          className="h-12 min-w-0 flex-1 rounded-xl border border-neutral-800 bg-neutral-950/70 px-3 text-base text-neutral-100 transition-colors placeholder:text-neutral-500 focus:border-accent/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className={`flex h-12 shrink-0 items-center justify-center rounded-xl bg-accent px-5 text-base font-semibold text-neutral-950 transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 ${
            loading ? "cursor-wait" : "disabled:cursor-not-allowed disabled:opacity-40"
          }`}
        >
          {loading ? (
            <Spinner className="h-5 w-5 motion-safe:animate-spin" />
          ) : (
            "Ask"
          )}
          {loading && <span className="sr-only">Asking…</span>}
        </button>
      </form>

      <div aria-live="polite">
        {asked && (
          <div className="mt-3 space-y-2 px-1 pb-1">
            <p className="break-words text-sm text-neutral-400">
              <span className="font-medium text-neutral-300">You asked:</span> {asked}
            </p>
            {loading && <p className="text-sm text-neutral-400">Thinking…</p>}
            {answer && (
              <p className="whitespace-pre-wrap break-words rounded-xl bg-neutral-950/70 p-4 text-[15px] leading-relaxed text-neutral-200">
                {answer}
              </p>
            )}
            {failed && (
              <p className="text-sm text-neutral-300">
                Couldn&apos;t get an answer right now. Try again in a moment.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
