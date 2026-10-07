import type { Metadata } from "next";
import type { ReactNode } from "react";
import BackLink from "@/components/BackLink";
import EvidenceChecklist from "@/components/EvidenceChecklist";
import IncidentSummary from "@/components/IncidentSummary";
import LanguageSelect from "@/components/LanguageSelect";
import PageShell from "@/components/PageShell";
import T from "@/components/T";
import { ExternalLinkIcon, PhoneIcon } from "@/components/icons";
import type { TranslationKey } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "I've been scammed · FinGuard",
  description:
    "Lost money to a scam? Five steps, most urgent first: stop further loss, call 1930, freeze your account, report it and keep the evidence.",
};

// This page must never fail, so it stays fully static: the build errors if
// anything here ever needs a server at request time.
export const dynamic = "error";

function Step({
  n,
  title,
  line,
  urgent = false,
  children,
}: {
  n: number;
  title: TranslationKey;
  line: ReactNode;
  urgent?: boolean;
  children?: ReactNode;
}) {
  return (
    <li className="group relative flex gap-3 pb-4 last:pb-0">
      {/* Timeline line down to the next step's number. */}
      <span
        aria-hidden="true"
        className="absolute -bottom-2 left-4 top-12 w-px -translate-x-1/2 bg-neutral-800 group-last:hidden"
      />
      <span
        aria-hidden="true"
        className={`mt-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          urgent ? "bg-red-600 text-white" : "bg-accent/15 text-accent"
        }`}
      >
        {n}
      </span>
      <div
        className={`min-w-0 flex-1 rounded-2xl border p-4 ${
          urgent
            ? "border-red-500/40 bg-red-500/[0.08] shadow-[0_0_48px_-16px_rgb(239_68_68/0.5)]"
            : "border-neutral-800 bg-neutral-900/60"
        }`}
      >
        <h2 className={`font-semibold tracking-tight text-neutral-100 ${urgent ? "text-xl" : "text-lg"}`}>
          <span className="sr-only">
            <T k="emergency.stepPrefix" vars={{ n }} />
          </span>
          <T k={title} />
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-neutral-400">{line}</p>
        {children}
      </div>
    </li>
  );
}

export default function EmergencyPage() {
  return (
    <PageShell
      header={
        <>
          <BackLink />
          <LanguageSelect />
        </>
      }
    >
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        <T k="emergency.title" />
      </h1>
      <p className="mt-2 leading-relaxed text-neutral-400">
        <T k="emergency.intro" />
      </p>

      <ol role="list" className="mt-8">
        <Step n={1} title="emergency.s1.title" line={<T k="emergency.s1.line" />} />
        <Step
          n={2}
          urgent
          title="emergency.s2.title"
          line={
            <>
              <T k="emergency.s2.lineA" />
              <strong className="font-semibold text-neutral-100">
                <T k="emergency.s2.lineStrong" />
              </strong>
              <T k="emergency.s2.lineB" />
            </>
          }
        >
          {/* Long translations wrap instead of overflowing the button; a word too
              wide for the narrowest phones breaks rather than spilling out. */}
          <a
            href="tel:1930"
            className="mt-4 flex min-h-20 w-full items-center justify-center gap-2.5 rounded-2xl bg-red-600 px-4 py-3 text-center text-3xl font-bold leading-tight tracking-tight text-white [overflow-wrap:anywhere] shadow-lg shadow-red-950/50 transition-colors hover:bg-red-500 active:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:min-h-24 sm:text-4xl"
          >
            <PhoneIcon className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
            <T k="emergency.s2.button" />
          </a>
        </Step>
        <Step n={3} title="emergency.s3.title" line={<T k="emergency.s3.line" />} />
        <Step n={4} title="emergency.s4.title" line={<T k="emergency.s4.line" />}>
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent/50 bg-accent/10 px-4 py-2 text-center text-[15px] font-semibold text-accent transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <T k="emergency.s4.button" />
            <ExternalLinkIcon className="h-4 w-4 shrink-0" />
            <span className="sr-only">
              <T k="emergency.s4.newTab" />
            </span>
          </a>
          <p className="mt-2 text-xs leading-relaxed text-neutral-500">
            <T k="emergency.s4.note" />
          </p>
        </Step>
        <Step n={5} title="emergency.s5.title" line={<T k="emergency.s5.line" />}>
          <EvidenceChecklist />
        </Step>
      </ol>

      <section aria-labelledby="incident-summary" className="mt-12">
        <h2 id="incident-summary" className="text-xl font-semibold tracking-tight text-neutral-100">
          <T k="incident.title" />
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-neutral-400">
          <T k="incident.intro" />
        </p>
        <IncidentSummary />
      </section>
    </PageShell>
  );
}
