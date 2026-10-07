import Analyser from "@/components/Analyser";
import { ShieldIcon } from "@/components/icons";

const STEPS = [
  {
    title: "Paste the message",
    body: "Any SMS, WhatsApp or email, in English, Hindi, Kannada or a mix.",
  },
  {
    title: "Gemini checks seven scam signals",
    body: "Urgency, threats, impersonation, links, OTP requests, unrealistic rewards and payment requests, scored with a weighted risk rubric.",
  },
  {
    title: "Get a verdict and next steps",
    body: "A 0–100 risk score, the likely scam type, why it's risky, and exactly what to do now.",
  },
];

export default function Home() {
  return (
    <div className="relative isolate min-h-dvh">
      {/* Soft accent glow behind the header. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_at_top,rgb(var(--accent)/0.14),transparent_65%)]"
      />
      <main className="mx-auto w-full max-w-xl px-4 pb-12 pt-12 sm:pt-20">
        <header className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/25">
            <ShieldIcon className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">FinGuard</h1>
          <p className="mt-3 text-base leading-relaxed text-neutral-400 sm:text-lg">
            Don&apos;t just detect the scam.{" "}
            <span className="block text-accent">Know what to do next.</span>
          </p>
        </header>

        <Analyser />

        <section aria-labelledby="problem" className="mt-20">
          <h2 id="problem" className="text-xs font-semibold uppercase tracking-widest text-accent">
            The problem
          </h2>
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
        </section>

        <section aria-labelledby="how-it-works" className="mt-14">
          <h2
            id="how-it-works"
            className="text-xs font-semibold uppercase tracking-widest text-accent"
          >
            How it works
          </h2>
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
        </section>

        {/* On phones the line breaks after "Gemini" rather than mid-phrase. */}
        <footer className="mt-14 border-t border-neutral-800 pt-6 text-center text-xs leading-relaxed text-neutral-500">
          <span className="block sm:inline">Built with Google Gemini</span>
          <span aria-hidden="true" className="hidden sm:inline">
            {" · "}
          </span>
          <span className="block sm:inline">structured JSON output · weighted risk rubric</span>
        </footer>
      </main>
    </div>
  );
}
