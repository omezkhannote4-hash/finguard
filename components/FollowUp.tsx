"use client";

import { useRef, useState, type FormEvent } from "react";
import { useT } from "@/components/LanguageProvider";
import { MicrophoneIcon, Spinner } from "@/components/icons";
import type { Analysis } from "@/lib/analysis";
import { speechLocale, type LanguageCode } from "@/lib/languages";
import { useSpeechInput } from "@/lib/speech";

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
  const t = useT();
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const [answer, setAnswer] = useState("");
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice input fills the box; the user checks it and presses Ask.
  const speech = useSpeechInput(speechLocale(language), (transcript) => {
    setQuestion(transcript.slice(0, MAX_QUESTION_LENGTH));
    inputRef.current?.focus();
  });

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
          {t("followup.placeholder")}
        </label>
        <input
          ref={inputRef}
          id="follow-up"
          type="text"
          value={question}
          onChange={(event) => {
            setQuestion(event.target.value);
            speech.clearError();
          }}
          readOnly={speech.listening}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder={speech.listening ? t("analyser.listening") : t("followup.placeholder")}
          autoComplete="off"
          className="h-12 min-w-0 flex-1 rounded-xl border border-neutral-800 bg-neutral-950/70 px-3 text-base text-neutral-100 transition-colors placeholder:text-neutral-500 focus:border-accent/60 focus:outline-none"
        />
        {/* Shown only in browsers with speech recognition. */}
        {speech.supported && (
          <button
            type="button"
            onClick={speech.listening ? speech.stop : speech.start}
            disabled={loading}
            aria-pressed={speech.listening}
            aria-label={speech.listening ? t("analyser.stopListening") : t("followup.speak")}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 ${
              speech.listening
                ? "border-red-500/60 bg-red-500/15 text-red-300"
                : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-neutral-500 hover:text-neutral-100"
            }`}
          >
            <MicrophoneIcon
              className={`h-5 w-5 ${speech.listening ? "motion-safe:animate-pulse" : ""}`}
            />
          </button>
        )}
        <button
          type="submit"
          disabled={loading || speech.listening || !question.trim()}
          className={`flex h-12 shrink-0 items-center justify-center rounded-xl bg-accent px-5 text-base font-semibold text-neutral-950 transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 ${
            loading ? "cursor-wait" : "disabled:cursor-not-allowed disabled:opacity-40"
          }`}
        >
          {loading ? <Spinner className="h-5 w-5 motion-safe:animate-spin" /> : t("followup.ask")}
          {loading && <span className="sr-only">{t("followup.asking")}</span>}
        </button>
      </form>
      {speech.listening && (
        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-red-300">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-red-400 motion-safe:animate-pulse" />
          {t("analyser.listeningHint")}
        </p>
      )}
      {speech.error && (
        <p role="status" className="mt-3 px-1 text-sm text-neutral-300">
          {t(speech.error)}
        </p>
      )}

      <div aria-live="polite">
        {asked && (
          <div className="mt-3 space-y-2 px-1 pb-1">
            <p className="break-words text-sm text-neutral-400">
              <span className="font-medium text-neutral-300">{t("followup.youAsked")}</span> {asked}
            </p>
            {loading && <p className="text-sm text-neutral-400">{t("followup.thinking")}</p>}
            {answer && (
              <p className="whitespace-pre-wrap break-words rounded-xl bg-neutral-950/70 p-4 text-[15px] leading-relaxed text-neutral-200">
                {answer}
              </p>
            )}
            {failed && <p className="text-sm text-neutral-300">{t("followup.failed")}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
