"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";

type FieldKey = "utr" | "amount" | "when" | "phone" | "upi" | "url";

const FIELDS: {
  key: FieldKey;
  label: string;
  type?: string;
  inputMode?: "decimal" | "url";
  placeholder?: string;
}[] = [
  { key: "utr", label: "Transaction ID or UTR", placeholder: "e.g. 412345678901" },
  { key: "amount", label: "Amount lost (₹)", inputMode: "decimal", placeholder: "e.g. 25,000" },
  { key: "when", label: "Date and time", type: "datetime-local" },
  { key: "phone", label: "Their phone number", type: "tel", placeholder: "e.g. +91 98765 43210" },
  { key: "upi", label: "Their UPI ID", placeholder: "e.g. name@bank" },
  { key: "url", label: "Website link (URL)", inputMode: "url", placeholder: "e.g. http://…" },
];

type Values = Record<FieldKey | "description", string>;

const EMPTY: Values = { utr: "", amount: "", when: "", phone: "", upi: "", url: "", description: "" };

function formatAmount(text: string) {
  const cleaned = text.replace(/[₹,\s]/g, "");
  return /^\d+(\.\d{1,2})?$/.test(cleaned) ? `₹${Number(cleaned).toLocaleString("en-IN")}` : text;
}

function formatWhen(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

// Plain text that pastes cleanly into a cybercrime.gov.in report or an email to the bank.
function buildSummary(values: Values) {
  const rows: [string, string][] = [
    ["Transaction ID / UTR", values.utr.trim()],
    ["Amount lost", values.amount.trim() && formatAmount(values.amount.trim())],
    ["Date and time", values.when && formatWhen(values.when)],
    ["Fraudster's phone number", values.phone.trim()],
    ["Fraudster's UPI ID", values.upi.trim()],
    ["Website / link", values.url.trim()],
  ];
  const lines = ["CYBER FRAUD INCIDENT SUMMARY", ""];
  for (const [label, value] of rows) {
    if (value) lines.push(`${label}: ${value}`);
  }
  if (values.description.trim()) lines.push("", "What happened:", values.description.trim());
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
  const [values, setValues] = useState<Values>(EMPTY);
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();
  const summary = buildSummary(values);
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
              {field.label}
            </label>
            <input
              id={`incident-${field.key}`}
              type={field.type ?? "text"}
              inputMode={field.inputMode}
              autoComplete="off"
              value={values[field.key]}
              onChange={(event) => update(field.key, event.target.value)}
              placeholder={field.placeholder}
              className={`h-12 ${fieldClass}`}
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label htmlFor="incident-description" className="text-sm font-medium text-neutral-300">
            Short description
          </label>
          <textarea
            id="incident-description"
            rows={4}
            maxLength={1000}
            value={values.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="e.g. A caller said they were from my bank and asked for the OTP to stop my card being blocked. ₹25,000 then left my account."
            className={`resize-y py-2.5 leading-relaxed ${fieldClass}`}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={copy}
        disabled={!hasContent}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent/50 bg-accent/10 text-base font-semibold text-accent transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "copied" ? (
          <>
            <CheckIcon className="h-5 w-5" />
            Copied
          </>
        ) : (
          <>
            <CopyIcon className="h-5 w-5" />
            Copy summary
          </>
        )}
      </button>
      <p aria-live="polite" className="mt-2 text-center text-xs text-neutral-500">
        {status === "copied"
          ? "Summary copied. Paste it into your report."
          : hasContent
            ? ""
            : "Fill in any field to build your summary."}
      </p>

      {status === "failed" && (
        <div className="mt-2">
          <p className="text-sm text-neutral-300">
            Couldn&apos;t copy automatically. Select the text below and copy it.
          </p>
          <textarea
            readOnly
            aria-label="Incident summary"
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
