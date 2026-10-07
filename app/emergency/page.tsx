import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import EvidenceChecklist from "@/components/EvidenceChecklist";
import PageShell from "@/components/PageShell";
import { ArrowLeftIcon, ExternalLinkIcon, PhoneIcon } from "@/components/icons";

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
  title: string;
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
          <span className="sr-only">Step {n}: </span>
          {title}
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
        <Link
          href="/"
          className="-ml-2 inline-flex h-11 items-center gap-2 rounded-full px-2 text-sm font-medium text-neutral-300 transition-colors hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to FinGuard
        </Link>
      }
    >
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Been scammed? Act now.</h1>
      <p className="mt-2 leading-relaxed text-neutral-400">Five steps, most urgent first.</p>

      <ol role="list" className="mt-8">
        <Step
          n={1}
          title="Stop further loss"
          line="Don't send more money, don't share your OTP, PIN or password, and stop replying to them."
        />
        <Step
          n={2}
          urgent
          title="Call 1930 now"
          line={
            <>
              India&apos;s cyber fraud helpline. Reporting{" "}
              <strong className="font-semibold text-neutral-100">within 24 hours</strong> gives the
              best chance of getting your money back.
            </>
          }
        >
          <a
            href="tel:1930"
            className="mt-4 flex h-20 w-full items-center justify-center gap-2.5 rounded-2xl bg-red-600 text-3xl font-bold tracking-tight text-white shadow-lg shadow-red-950/50 transition-colors hover:bg-red-500 active:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:h-24 sm:text-4xl"
          >
            <PhoneIcon className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
            Call 1930
          </a>
        </Step>
        <Step
          n={3}
          title="Freeze your account"
          line="Call the number on your bank card. Ask them to freeze it and raise a dispute."
        />
        <Step n={4} title="File a report" line="Report it on the National Cyber Crime Reporting Portal.">
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent/50 bg-accent/10 px-4 py-2 text-center text-[15px] font-semibold text-accent transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Open cybercrime.gov.in
            <ExternalLinkIcon className="h-4 w-4 shrink-0" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <p className="mt-2 text-xs leading-relaxed text-neutral-500">
            FinGuard is not a government service and does not file this report for you.
          </p>
        </Step>
        <Step
          n={5}
          title="Preserve evidence"
          line="Don't delete anything. Tick each item once you've saved it."
        >
          <EvidenceChecklist />
        </Step>
      </ol>
    </PageShell>
  );
}
