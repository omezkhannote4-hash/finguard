"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import FollowUp from "@/components/FollowUp";
import { useLanguage } from "@/components/LanguageProvider";
import ResultCard from "@/components/ResultCard";
import ResultSkeleton from "@/components/ResultSkeleton";
import { PhotoIcon, Spinner } from "@/components/icons";
import type { Analysis } from "@/lib/analysis";
import { imageToDataUrl } from "@/lib/image";
import presets from "@/lib/presets.json";
import { PRESET_FALLBACKS } from "@/lib/preset-fallbacks";

// Matches the limit enforced by /api/analyse.
const MAX_LENGTH = 5000;
// How long a demo waits for a live result in another language before showing its saved one.
const DEMO_TIMEOUT_MS = 10_000;

type Result = { id: number; analysis: Analysis; message: string; note?: string };

export default function Analyser() {
  const { language } = useLanguage();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inFlight = useRef<AbortController | null>(null);
  const resultCount = useRef(0);

  // On phones the result appears below the fold, so bring it into view.
  useEffect(() => {
    if (!result && !unavailable) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [result, unavailable]);

  function showResult(analysis: Analysis, text: string, note?: string) {
    resultCount.current += 1;
    setResult({ id: resultCount.current, analysis, message: text, note });
  }

  // A new message makes the previous result stale: clear it and cancel any
  // live request that's still running.
  function clearResult() {
    const running = inFlight.current;
    inFlight.current = null;
    running?.abort();
    setLoading(false);
    setResult(null);
    setUnavailable(false);
  }

  function updateMessage(text: string) {
    if (text === message) return;
    setMessage(text);
    setReadError("");
    clearResult();
  }

  async function runAnalysis(text: string) {
    const preset = presets.find((p) => p.text.trim() === text);
    const saved = preset ? PRESET_FALLBACKS[preset.id] : undefined;

    // In English, an unedited demo shows its saved result without calling the API.
    if (saved && language === "en") {
      setUnavailable(false);
      showResult(saved, text);
      return;
    }

    // Everything else goes live. A demo in another language falls back to its
    // saved English result if the live call fails or is slow.
    const controller = new AbortController();
    inFlight.current = controller;
    const timer = saved ? setTimeout(() => controller.abort(), DEMO_TIMEOUT_MS) : undefined;
    setLoading(true);
    setResult(null);
    setUnavailable(false);

    let analysis: Analysis | null = null;
    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        analysis = data as Analysis;
      } else if (inFlight.current === controller) {
        console.warn(`Live analysis failed (HTTP ${res.status}):`, data?.error);
      }
    } catch (err) {
      if (inFlight.current === controller) console.warn("Live analysis failed:", err);
    } finally {
      clearTimeout(timer);
    }

    // The message changed while this was running, so its result is stale.
    if (inFlight.current !== controller) return;
    inFlight.current = null;
    setLoading(false);
    if (analysis) {
      showResult(analysis, text);
    } else if (saved) {
      showResult(saved, text, "Live analysis wasn't available, so this is the saved English example.");
    } else {
      setUnavailable(true);
    }
  }

  function analyse(event: FormEvent) {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading || reading) return;
    runAnalysis(text);
  }

  // Reads the text out of a screenshot, puts it in the box and analyses it.
  async function readScreenshot(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // so picking the same file again still works
    if (!file || reading) return;

    clearResult();
    setReadError("");
    setReading(true);
    let text = "";
    try {
      let image = "";
      try {
        image = await imageToDataUrl(file);
      } catch (err) {
        console.warn("Couldn't open the image:", err);
        setReadError("Couldn't open that image. Try a PNG or JPEG, or type the message instead.");
      }
      if (image) {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok && typeof data?.text === "string" && data.text.trim()) {
          text = data.text.trim().slice(0, MAX_LENGTH);
        } else {
          console.warn(`Reading the screenshot failed (HTTP ${res.status}):`, data?.error);
          setReadError(
            res.status === 422
              ? "No text found in that image. Type or paste the message instead."
              : "Couldn't read that image. Type or paste the message instead.",
          );
        }
      }
    } catch (err) {
      console.warn("Reading the screenshot failed:", err);
      setReadError("Couldn't read that image. Type or paste the message instead.");
    } finally {
      setReading(false);
    }

    if (text) {
      setMessage(text);
      runAnalysis(text);
    } else {
      textareaRef.current?.focus();
    }
  }

  // Ctrl/Cmd + Enter submits, like most chat and search boxes.
  function submitOnShortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const status = reading
    ? "Reading image…"
    : loading
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
              disabled={reading}
              onClick={() => updateMessage(preset.text)}
              className={`inline-flex min-h-11 items-center text-balance rounded-full border px-4 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${
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
          ref={textareaRef}
          id="message"
          value={message}
          onChange={(e) => updateMessage(e.target.value)}
          onKeyDown={submitOnShortcut}
          readOnly={reading}
          rows={6}
          maxLength={MAX_LENGTH}
          placeholder="e.g. Dear customer, your KYC has expired and your account will be blocked today. Update now: http://…"
          className="mt-2 block w-full resize-y bg-transparent px-2 py-1 text-base leading-relaxed text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
        />
        <div className="mt-3 flex gap-2">
          {/* Hidden picker, opened by the screenshot button. */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={readScreenshot}
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={reading || loading}
            className={`flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 text-sm font-medium text-neutral-200 transition-colors hover:border-neutral-500 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              reading ? "cursor-wait" : "disabled:cursor-not-allowed disabled:opacity-40"
            }`}
          >
            {reading ? (
              <>
                <Spinner className="h-5 w-5 motion-safe:animate-spin" />
                Reading image…
              </>
            ) : (
              <>
                <PhotoIcon className="h-5 w-5" />
                <span className="sm:hidden">Screenshot</span>
                <span className="hidden sm:inline">Upload screenshot</span>
              </>
            )}
          </button>
          <button
            type="submit"
            disabled={loading || reading || !message.trim()}
            className={`flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-base font-semibold text-neutral-950 transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 ${
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
        </div>
      </form>
      {readError && (
        <p
          role="status"
          className="mt-3 rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-300"
        >
          {readError}
        </p>
      )}
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
        {result && (
          <>
            {result.note && (
              <p className="mb-3 text-center text-xs text-neutral-500">{result.note}</p>
            )}
            <ResultCard analysis={result.analysis} message={result.message} />
            <FollowUp
              key={result.id}
              message={result.message}
              analysis={result.analysis}
              language={language}
            />
          </>
        )}
      </div>
    </div>
  );
}
