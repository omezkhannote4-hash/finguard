import type { ReactNode } from "react";

// The frame every page shares, so they match exactly: the accent glow, a sticky
// header (always visible), the content column and the footer.
export default function PageShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="relative isolate min-h-dvh">
      {/* Soft accent glow behind the header. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_at_top,rgb(var(--accent)/0.14),transparent_65%)]"
      />
      <header className="sticky top-0 z-30 border-b border-neutral-800/60 bg-neutral-950/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-xl items-center justify-between gap-3 px-4">
          {header}
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl px-4 pb-14 pt-10 sm:pt-14">{children}</main>
      <footer className="mx-auto w-full max-w-xl px-4 pb-10">
        <div className="border-t border-neutral-800 pt-6 text-center text-xs leading-relaxed text-neutral-500">
          <p className="text-balance text-sm font-medium text-neutral-300">
            FinGuard never asks for your password, OTP or PIN.
          </p>
          {/* On phones the line breaks after "Groq" rather than mid-phrase. */}
          <p className="mt-2">
            <span className="block sm:inline">Built on Groq</span>
            <span aria-hidden="true" className="hidden sm:inline">
              {" · "}
            </span>
            <span className="block sm:inline">structured JSON output · weighted risk rubric</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
