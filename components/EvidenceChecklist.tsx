"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";

const ITEMS = [
  "Screenshots",
  "Transaction ID or UTR",
  "Amount",
  "Date and time",
  "Their phone number",
  "Their UPI ID",
  "Website link (URL)",
  "Chat history",
];

// Ticks live in React state only: nothing is stored or sent anywhere.
export default function EvidenceChecklist() {
  const [checked, setChecked] = useState(() => ITEMS.map(() => false));
  const saved = checked.filter(Boolean).length;

  function toggle(index: number) {
    setChecked((prev) => prev.map((value, i) => (i === index ? !value : value)));
  }

  return (
    <div className="mt-3">
      <ul role="list" className="grid sm:grid-cols-2 sm:gap-x-4">
        {ITEMS.map((item, i) => (
          <li key={item}>
            <label className="relative -mx-2 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-[15px] text-neutral-200 transition-colors hover:bg-neutral-800/50">
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => toggle(i)}
                className="peer sr-only"
              />
              {/* The tick is drawn in currentColor, which is transparent until checked. */}
              <span
                aria-hidden="true"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-neutral-600 bg-neutral-950 text-transparent transition-colors peer-checked:border-accent peer-checked:bg-accent peer-checked:text-neutral-950 peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-neutral-900"
              >
                <CheckIcon className="h-4 w-4" />
              </span>
              <span className="peer-checked:text-neutral-400">{item}</span>
            </label>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="mt-2 text-xs text-neutral-500">
        {saved === ITEMS.length
          ? "All saved. Keep them for your bank and the police."
          : `${saved} of ${ITEMS.length} saved`}
      </p>
    </div>
  );
}
