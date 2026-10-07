"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import FollowUp from "@/components/FollowUp";
import { useLanguage, useT } from "@/components/LanguageProvider";
import ResultCard from "@/components/ResultCard";
import ResultSkeleton from "@/components/ResultSkeleton";
import { MicrophoneIcon, PhotoIcon, Spinner } from "@/components/icons";
import type { Analysis } from "@/lib/analysis";
import { LEVEL_KEYS, type TranslationKey } from "@/lib/i18n";
import { imageToDataUrl } from "@/lib/image";
import { INPUT_TYPES, type InputTypeId } from "@/lib/input-types";
import { speechLocale } from "@/lib/languages";
import presets from "@/lib/presets.json";
import { PRESET_FALLBACKS } from "@/lib/preset-fallbacks";
import { useSpeechInput } from "@/lib/speech";

// Matches the limit enforced by /api/analyse.
const MAX_LENGTH = 5000;
// How long a demo waits for a live result in another language before showing its saved one.
const DEMO_TIMEOUT_MS = 10_000;

type Result = { id: number; analysis: Analysis; message: string; note?: TranslationKey };
// The demo ids in presets.json; their button labels live in lib/i18n.ts.
type PresetId = "kyc" | "lottery" | "investment" | "hdfc";

export default function Analyser() {
  const { language } = useLanguage();
  const t = useT();
  const [message, setMessage] = useState("");
  const [inputType, setInputType] = useState<InputTypeId>("message");
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<TranslationKey | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inFlight = useRef<AbortController | null>(null);
  const resultCount = useRef(0);

  // Voice input: what was said replaces the text in the box and is analysed straight away.
  const speech = useSpeechInput(speechLocale(language), (transcript) => {
    const text = transcript.slice(0, MAX_LENGTH);
    setMessage(text);
    setReadError(null);
    runAnalysis(text);
  });

  // On phones the result appears below the fold, so bring it into view.
  useEffect(() => {
    if (!result && !unavailable) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [result, unavailable]);

  function showResult(analysis: Analysis, text: string, note?: TranslationKey) {
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
    setReadError(null);
    speech.clearError();
    clearResult();
  }

  // The demos are messages, so picking one switches back to the Message tab.
  function choosePreset(text: string) {
    if (inputType !== "message") {
      setInputType("message");
      clearResult();
    }
    updateMessage(text);
  }

  function changeType(id: InputTypeId) {
    if (id === inputType) return;
    setInputType(id);
    clearResult();
  }

  async function runAnalysis(text: string) {
    const preset = inputType === "message" ? presets.find((p) => p.text.trim() === text) : undefined;
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
        body: JSON.stringify({ message: text, language, inputType }),
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
      showResult(saved, text, "analyser.savedNote");
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
    setReadError(null);
    setReading(true);
    let text = "";
    try {
      let image = "";
      try {
        image = await imageToDataUrl(file);
      } catch (err) {
        console.warn("Couldn't open the image:", err);
        setReadError("read.cantOpen");
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
          setReadError(res.status === 422 ? "read.noText" : "read.failed");
        }
      }
    } catch (err) {
      console.warn("Reading the screenshot failed:", err);
      setReadError("read.failed");
    } finally {
      setReading(false);
    }

    if (text) {
      // A screenshot is of a message, whichever tab was open.
      setInputType("message");
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
    ? t("analyser.readingImage")
    : speech.listening
      ? t("analyser.listening")
      : loading
        ? t("analyser.statusAnalysing")
        : result
          ? t("analyser.statusReady", {
              score: result.analysis.risk_score,
              level: t(LEVEL_KEYS[result.analysis.risk_level]),
            })
          : "";

  return (
    <div className="mt-10">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        {t("analyser.tryDemo")}
      </p>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const active = message === preset.text;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={active}
              disabled={reading || speech.listening}
              onClick={() => choosePreset(preset.text)}
              className={`inline-flex min-h-11 items-center text-balance rounded-full border px-4 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? "border-accent/60 bg-accent/10 text-accent"
                  : "border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:border-neutral-600 hover:text-neutral-100"
              }`}
            >
              {t(`preset.${preset.id as PresetId}`)}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={analyse}
        className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3 transition-colors focus-within:border-accent/60"
      >
        <fieldset>
          <legend className="sr-only">{t("analyser.typeLegend")}</legend>
          {/* Tighter on the narrowest phones; scrolls sideways rather than overlapping. */}
          <div className="flex gap-0.5 overflow-x-auto rounded-xl bg-neutral-950/60 p-1 min-[360px]:gap-1">
            {INPUT_TYPES.map((option) => (
              <label key={option.id} className="relative shrink-0 flex-auto">
                <input
                  type="radio"
                  name="input-type"
                  value={option.id}
                  checked={inputType === option.id}
                  onChange={() => changeType(option.id)}
                  disabled={reading || speech.listening}
                  className="peer sr-only"
                />
                <span className="flex h-10 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg px-1.5 text-[13px] font-medium min-[360px]:px-2 text-neutral-400 transition-colors hover:text-neutral-200 peer-checked:bg-neutral-800 peer-checked:text-neutral-100 peer-focus-visible:ring-2 peer-focus-visible:ring-accent sm:text-sm">
                  {t(`type.${option.id}.label`)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label htmlFor="message" className="mt-2 block px-2 pt-1 text-sm font-medium text-neutral-300">
          {t(`type.${inputType}.heading`)}
        </label>
        <textarea
          ref={textareaRef}
          id="message"
          value={message}
          onChange={(e) => updateMessage(e.target.value)}
          onKeyDown={submitOnShortcut}
          readOnly={reading || speech.listening}
          rows={6}
          maxLength={MAX_LENGTH}
          placeholder={speech.listening ? t("analyser.listening") : t(`type.${inputType}.placeholder`)}
          className="mt-2 block w-full resize-y bg-transparent px-2 py-1 text-base leading-relaxed text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
        />
        {/* If a language's labels are too long for one row, Analyse moves to its own row. */}
        <div className="mt-3 flex flex-wrap gap-2">
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
            disabled={reading || loading || speech.listening}
            className={`flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 text-sm font-medium text-neutral-200 transition-colors hover:border-neutral-500 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              reading ? "cursor-wait" : "disabled:cursor-not-allowed disabled:opacity-40"
            }`}
          >
            {reading ? (
              <>
                <Spinner className="h-5 w-5 motion-safe:animate-spin" />
                {t("analyser.readingImage")}
              </>
            ) : (
              <>
                <PhotoIcon className="h-5 w-5" />
                {/* Icon only on the narrowest phones, to leave room for the microphone. */}
                <span className="max-[359px]:sr-only sm:hidden">{t("analyser.screenshot")}</span>
                <span className="hidden sm:inline">{t("analyser.uploadScreenshot")}</span>
              </>
            )}
          </button>
          {/* Shown only in browsers with speech recognition. */}
          {speech.supported && !reading && (
            <button
              type="button"
              onClick={speech.listening ? speech.stop : speech.start}
              disabled={loading}
              aria-pressed={speech.listening}
              aria-label={speech.listening ? t("analyser.stopListening") : t("analyser.speak")}
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
            disabled={loading || reading || speech.listening || !message.trim()}
            className={`flex h-12 min-w-max flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-base font-semibold text-neutral-950 transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 ${
              loading ? "cursor-wait" : "disabled:cursor-not-allowed disabled:opacity-40"
            }`}
          >
            {loading ? (
              <>
                <Spinner className="h-5 w-5 motion-safe:animate-spin" />
                {t("analyser.analysing")}
              </>
            ) : (
              t("analyser.analyse")
            )}
          </button>
        </div>
      </form>
      {speech.listening && (
        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-red-300">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-red-400 motion-safe:animate-pulse" />
          {t("analyser.listeningHint")}
        </p>
      )}
      {speech.error && (
        <p
          role="status"
          className="mt-3 rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-300"
        >
          {t(speech.error)}
        </p>
      )}
      {readError && (
        <p
          role="status"
          className="mt-3 rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-300"
        >
          {t(readError)}
        </p>
      )}
      <p className="mt-3 text-center text-xs text-neutral-500">{t("analyser.worksWith")}</p>

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
            {t("analyser.unavailable")}
          </p>
        )}
        {/* Keyed by result, so each new result starts a fresh card and follow-up. */}
        {result && (
          <Fragment key={result.id}>
            {result.note && (
              <p className="mb-3 text-center text-xs text-neutral-500">{t(result.note)}</p>
            )}
            <ResultCard analysis={result.analysis} message={result.message} />
            <FollowUp message={result.message} analysis={result.analysis} language={language} />
          </Fragment>
        )}
      </div>
    </div>
  );
}
