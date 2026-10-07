"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage, useT } from "@/components/LanguageProvider";
import { CheckIcon, CopyIcon } from "@/components/icons";
import type { TranslationKey } from "@/lib/i18n";

type FieldKey = "utr" | "amount" | "when" | "phone" | "upi" | "url";
type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

// Labels and placeholders are in lib/i18n.ts under incident.field.* and incident.placeholder.*.
const FIELDS: { key: FieldKey; type?: string; inputMode?: "decimal" | "url"; placeholder: boolean }[] = [
  { key: "utr", placeholder: true },
  { key: "amount", inputMode: "decimal", placeholder: true },
  { key: "when", type: "datetime-local", placeholder: false },
  { key: "phone", type: "tel", placeholder: true },
  { key: "upi", placeholder: true },
  { key: "url", inputMode: "url", placeholder: true },
];

type Values = Record<FieldKey | "description", string>;

const EMPTY: Values = { utr: "", amount: "", when: "", phone: "", upi: "", url: "", description: "" };

function formatAmount(text: string, locale: string) {
  const cleaned = text.replace(/[₹,\s]/g, "");
  return /^\d+(\.\d{1,2})?$/.test(cleaned) ? `₹${Number(cleaned).toLocaleString(locale)}` : text;
}

function formatWhen(value: string, locale: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

// Plain text that pastes cleanly into a cybercrime.gov.in report or an email to
// the bank, with its labels and date in the chosen language.
function buildSummary(values: Values, t: Translate, locale: string) {
  const rows: [TranslationKey, string][] = [
    ["summary.utr", values.utr.trim()],
    ["summary.amount", values.amount.trim() && formatAmount(values.amount.trim(), locale)],
    ["summary.when", values.when && formatWhen(values.when, locale)],
    ["summary.phone", values.phone.trim()],
    ["summary.upi", values.upi.trim()],
    ["summary.url", values.url.trim()],
  ];
  const lines = [t("summary.heading"), ""];
  for (const [label, value] of rows) {
    if (value) lines.push(`${t(label)}: ${value}`);
  }
  if (values.description.trim()) lines.push("", t("summary.what"), values.description.trim());
  return lines.join("\n");
}

// For browsers, or pages not served over HTTPS, without the Clipboard API.
function copyWithSelection(text: string) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  area.remove();
  return copied;
}

// Everything stays in React state: nothing is stored or sent anywhere.
export default function IncidentSummary() {
  const { language } = useLanguage();
  const t = useT();
  const [values, setValues] = useState<Values>(EMPTY);
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();
  const summary = buildSummary(values, t, `${language}-IN`);
  const hasContent = Object.values(values).some((value) => value.trim());

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  function update(key: keyof Values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setStatus("idle");
  }

  async function copy() {
    let copied = false;
    try {
      await navigator.clipboard.writeText(summary);
      copied = true;
    } catch {
      copied = copyWithSelection(summary);
    }
    clearTimeout(resetTimer.current);
    if (copied) {
      setStatus("copied");
      resetTimer.current = setTimeout(() => setStatus("idle"), 2500);
    } else {
      setStatus("failed");
    }
  }

  const fieldClass =
    "mt-2 block w-full min-w-0 appearance-none rounded-xl border border-neutral-800 bg-neutral-950/70 px-3 text-base text-neutral-100 transition-colors placeholder:text-neutral-500 focus:border-accent/60 focus:outline-none";

  return (
    <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key} className="min-w-0">
            <label htmlFor={`incident-${field.key}`} className="text-sm font-medium text-neutral-300">
              {t(`incident.field.${field.key}`)}
            </label>
            <input
              id={`incident-${field.key}`}
              type={field.type ?? "text"}
              inputMode={field.inputMode}
              autoComplete="off"
              value={values[field.key]}
              onChange={(event) => update(field.key, event.target.value)}
              placeholder={
                field.placeholder && field.key !== "when" ? t(`incident.placeholder.${field.key}`) : undefined
              }
              className={`h-12 ${fieldClass}`}
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label htmlFor="incident-description" className="text-sm font-medium text-neutral-300">
            {t("incident.field.description")}
          </label>
          <textarea
            id="incident-description"
            rows={4}
            maxLength={1000}
            value={values.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder={t("incident.placeholder.description")}
            className={`resize-y py-2.5 leading-relaxed ${fieldClass}`}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={copy}
        disabled={!hasContent}
        className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent/50 bg-accent/10 px-4 py-2 text-center text-base font-semibold text-accent transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "copied" ? (
          <>
            <CheckIcon className="h-5 w-5 shrink-0" />
            {t("incident.copied")}
          </>
        ) : (
          <>
            <CopyIcon className="h-5 w-5 shrink-0" />
            {t("incident.copy")}
          </>
        )}
      </button>
      <p aria-live="polite" className="mt-2 text-center text-xs text-neutral-500">
        {status === "copied"
          ? t("incident.copiedNote")
          : hasContent
            ? ""
            : t("incident.fillHint")}
      </p>

      {status === "failed" && (
        <div className="mt-2">
          <p className="text-sm text-neutral-300">{t("incident.copyFailed")}</p>
          <textarea
            readOnly
            aria-label={t("incident.title")}
            value={summary}
            rows={8}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-2 block w-full resize-y rounded-xl border border-neutral-800 bg-neutral-950/70 px-3 py-2.5 text-sm leading-relaxed text-neutral-200 focus:border-accent/60 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
