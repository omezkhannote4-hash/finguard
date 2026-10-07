import Link from "next/link";
import type { ReactNode } from "react";
import Analyser from "@/components/Analyser";
import PageShell from "@/components/PageShell";
import { AlertIcon, ArrowRightIcon, CheckIcon, ShieldIcon } from "@/components/icons";
import { SIGNALS } from "@/lib/analysis";

const STEPS = [
  {
    title: "Paste the message",
    body: "Any SMS, WhatsApp or email, in English, Hindi, Kannada or a mix.",
  },
  {
    title: "Gemini checks seven scam signals",
    body: "The Scam DNA signals above, scored with a weighted risk rubric.",
  },
  {
    title: "Get a verdict and next steps",
    body: "A 0–100 risk score, the likely scam type, why it's risky, and exactly what to do now.",
  },
];

const PHASES: { label: string; title: string; body: string; href?: string }[] = [
  {
    label: "Before",
    title: "Check before you act",
    body: "Paste a suspicious message before you click, pay or reply.",
  },
  {
    label: "During",
    title: "Understand the risk",
    body: "See the risk score, the scam type and the exact warning signs.",
  },
  {
    label: "After",
    title: "Know what to do if money is gone",
    body: "Follow the emergency steps, starting with a call to 1930.",
    href: "/emergency",
  },
];

const OTHERS = ["Detect", "Warn", "Done"];
const FINGUARD = ["Detect", "Explain why", "Show what happens next", "Tell you what to do"];

function Section({
  id,
  title,
  className = "mt-14",
  children,
}: {
  id: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={className}>
      <h2 id={id} className="text-xs font-semibold uppercase tracking-widest text-accent">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Home() {
  return (
    <PageShell
      header={
        <>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg font-semibold tracking-tight text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/25">
              <ShieldIcon className="h-5 w-5" />
            </span>
            FinGuard
          </Link>
          <Link
            href="/emergency"
            className="inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-red-600 px-4 text-sm font-semibold text-white shadow-lg shadow-red-950/40 transition-colors hover:bg-red-500 active:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            {/* Dropped on the narrowest phones so the header never overflows. */}
            <AlertIcon className="hidden h-4 w-4 min-[360px]:block" />
            I&apos;ve been scammed
          </Link>
        </>
      }
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">FinGuard</h1>
        <p className="mt-3 text-base leading-relaxed text-neutral-400 sm:text-lg">
          Don&apos;t just detect the scam.{" "}
          <span className="block text-accent">Know what to do next.</span>
        </p>
      </div>

      <Analyser />

      <Section id="scam-dna" title="Scam DNA" className="mt-16">
        <p className="mt-3 leading-relaxed text-neutral-400">
          Every message is checked for the same seven signals.
        </p>
        <ul role="list" className="mt-4 flex flex-wrap gap-2">
          {SIGNALS.map((signal) => (
            <li
              key={signal}
              className="rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-sm text-neutral-200"
            >
              {signal}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="problem" title="The problem">
        <p className="mt-3 text-lg leading-relaxed text-neutral-100">
          In 2025, Indians lost ₹19,813 crore to cyber fraud across about 21.8 lakh complaints,
          and 77% of that money went to fake investment schemes.
        </p>
        <p className="mt-2 leading-relaxed text-neutral-400">
          Most of it starts with one convincing message, and few people know what to do next.
        </p>
        <p className="mt-3 text-xs text-neutral-500">
          Source: Indian Cyber Crime Coordination Centre (I4C) and the National Cyber Crime
          Reporting Portal.
        </p>
      </Section>

      <Section id="how-it-works" title="How it works">
        <ol role="list" className="mt-4 space-y-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold text-neutral-100">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-400">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="before-during-after" title="Before / During / After">
        <ol role="list" className="mt-4 grid gap-3 sm:grid-cols-3">
          {PHASES.map((phase) => (
            <li
              key={phase.label}
              className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4"
            >
              <p
                className={`text-xs font-semibold uppercase tracking-widest ${
                  phase.href ? "text-red-400" : "text-accent"
                }`}
              >
                {phase.label}
              </p>
              <h3 className="mt-2 font-semibold leading-snug text-neutral-100">{phase.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-neutral-400">{phase.body}</p>
              {phase.href && (
                <Link
                  href={phase.href}
                  className="mt-3 inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg text-sm font-semibold text-red-400 transition-colors hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  Emergency steps
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              )}
            </li>
          ))}
        </ol>
      </Section>

      <Section id="different" title="Why FinGuard is different">
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <h3 className="text-sm font-semibold text-neutral-400">Others</h3>
            <ul role="list" className="mt-3 space-y-2.5">
              {OTHERS.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-snug text-neutral-400">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-600"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-accent/40 bg-accent/[0.06] p-4">
            <h3 className="text-sm font-semibold text-accent">FinGuard</h3>
            <ul role="list" className="mt-3 space-y-2.5">
              {FINGUARD.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm font-medium leading-snug text-neutral-100"
                >
                  <CheckIcon className="mt-px h-4 w-4 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <p className="mt-16 text-balance text-center text-2xl font-semibold leading-snug tracking-tight text-neutral-100 sm:text-3xl">
        The real problem isn&apos;t only detecting the scam.{" "}
        <span className="block text-accent">It&apos;s knowing what to do next.</span>
      </p>
    </PageShell>
  );
}
