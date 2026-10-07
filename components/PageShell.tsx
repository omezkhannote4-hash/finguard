import Link from "next/link";
import type { ReactNode } from "react";
import T from "@/components/T";
import { ArrowRightIcon } from "@/components/icons";

// The frame every page shares, so they match exactly: the accent glow, a sticky
// header (always visible), the content column and the footer.
// `belowHeader` holds links that don't fit in the header on phones; it isn't sticky.
export default function PageShell({
  header,
  belowHeader,
  children,
}: {
  header: ReactNode;
  belowHeader?: ReactNode;
  children: ReactNode;
}) {
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
      {belowHeader && <div className="mx-auto w-full max-w-xl px-4">{belowHeader}</div>}
      <main className="mx-auto w-full max-w-xl px-4 pb-14 pt-10 sm:pt-14">{children}</main>
      <footer className="mx-auto w-full max-w-xl px-4 pb-10">
        <div className="border-t border-neutral-800 pt-6 text-center text-xs leading-relaxed text-neutral-500">
          <p className="text-balance text-sm font-medium text-neutral-300">
            <T k="footer.neverAsks" />
          </p>
          <p className="mt-2">
            <Link
              href="/learn"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-semibold text-accent transition-colors hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <T k="footer.learn" />
              <ArrowRightIcon className="h-4 w-4 shrink-0" />
            </Link>
          </p>
          {/* On phones the line breaks after "Groq" rather than mid-phrase. */}
          <p className="mt-1">
            <span className="block sm:inline">
              <T k="footer.builtOn" />
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              {" · "}
            </span>
            <span className="block sm:inline">
              <T k="footer.tech" />
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
