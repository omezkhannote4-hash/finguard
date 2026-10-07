"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { Analysis } from "@/lib/analysis";
import presets from "@/lib/presets.json";
import { PRESET_FALLBACKS } from "@/lib/preset-fallbacks";
import ResultCard from "@/components/ResultCard";
import { Spinner } from "@/components/icons";

// Matches the limit enforced by /api/analyse.
const MAX_LENGTH = 5000;

type Result = { analysis: Analysis; message: string };

export default function Analyser() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
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

  // Editing the message makes the previous result stale, so clear it straight
  // away and cancel any live request that's still running.
  function updateMessage(text: string) {
    if (text === message) return;
    setMessage(text);
    inFlight.current?.abort();
    inFlight.current = null;
    setLoading(false);
    setResult(null);
    setUnavailable(false);
  }

  async function analyse(event: FormEvent) {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading) return;

    // An unedited demo message shows its saved result without calling the API.
    const preset = presets.find((p) => p.text.trim() === text);
    const saved = preset ? PRESET_FALLBACKS[preset.id] : undefined;
    if (saved) {
      setUnavailable(false);
      setResult({ analysis: saved, message: text });
      return;
    }

    // Anything typed goes to the live API.
    const controller = new AbortController();
    inFlight.current = controller;
    setLoading(true);
    setResult(null);
    setUnavailable(false);
    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (controller.signal.aborted) return;
      if (res.ok && data) {
        setResult({ analysis: data as Analysis, message: text });
      } else {
        console.warn(`Live analysis failed (HTTP ${res.status}):`, data?.error);
        setUnavailable(true);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      console.warn("Live analysis failed:", err);
      setUnavailable(true);
    } finally {
      if (inFlight.current === controller) {
        inFlight.current = null;
        setLoading(false);
      }
    }
  }

  // Ctrl/Cmd + Enter submits, like most chat and search boxes.
  function submitOnShortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const status = loading
    ? "Analysing your message…"
    : result
      ? `Analysis ready: risk score ${result.analysis.risk_score} out of 100, ${result.analysis.risk_level}.`
      : "";

  return (
    <div className="mt-10">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        Try a demo
      </p>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const active = message === preset.text;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={active}
              onClick={() => updateMessage(preset.text)}
              className={`inline-flex min-h-11 items-center text-balance rounded-full border px-4 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active
                  ? "border-accent/60 bg-accent/10 text-accent"
                  : "border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:border-neutral-600 hover:text-neutral-100"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={analyse}
        className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3 transition-colors focus-within:border-accent/60"
      >
        <label htmlFor="message" className="block px-2 pt-1 text-sm font-medium text-neutral-300">
          Paste the SMS, WhatsApp or email you received
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => updateMessage(e.target.value)}
          onKeyDown={submitOnShortcut}
          rows={6}
          maxLength={MAX_LENGTH}
          placeholder="e.g. Dear customer, your KYC has expired and your account will be blocked today. Update now: http://…"
          className="mt-2 block w-full resize-y bg-transparent px-2 py-1 text-base leading-relaxed text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className={`mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-base font-semibold text-neutral-950 transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 ${
            loading ? "cursor-wait" : "disabled:cursor-not-allowed disabled:opacity-40"
          }`}
        >
          {loading ? (
            <>
              <Spinner className="h-5 w-5 motion-safe:animate-spin" />
              Analysing…
            </>
          ) : (
            "Analyse"
          )}
        </button>
      </form>
      <p className="mt-3 text-center text-xs text-neutral-500">
        Works with English, हिन्दी, ಕನ್ನಡ or a mix.
      </p>

      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      {/* scroll-mt clears the sticky header when the result scrolls into view. */}
      <div ref={resultRef} className="mt-8 scroll-mt-24">
        {loading && <ResultSkeleton />}
        {unavailable && (
          <p
            role="status"
            className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-300"
          >
            Live analysis isn&apos;t available right now. Try one of the demo messages above.
          </p>
        )}
        {result && <ResultCard analysis={result.analysis} message={result.message} />}
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-5 py-6 motion-safe:animate-pulse sm:px-6"
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <div className="h-36 w-36 shrink-0 rounded-full border-[10px] border-neutral-800" />
        <div className="w-full space-y-3">
          <div className="mx-auto h-6 w-28 rounded-full bg-neutral-800 sm:mx-0" />
          <div className="h-4 w-full rounded bg-neutral-800" />
          <div className="mx-auto h-4 w-2/3 rounded bg-neutral-800 sm:mx-0" />
        </div>
      </div>
      <div className="mt-8 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-4 rounded bg-neutral-800" />
        ))}
      </div>
    </div>
  );
}
