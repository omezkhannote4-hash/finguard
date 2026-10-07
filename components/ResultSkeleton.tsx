// Placeholder shaped like a result card, shown while a check is running.
export default function ResultSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-5 py-6 motion-safe:animate-pulse sm:px-6"
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <div className="h-36 w-36 shrink-0 rounded-full border-[10px] border-neutral-800" />
        <div className="w-full space-y-3">
          <div className="mx-auto h-6 w-28 rounded-full bg-neutral-800 sm:mx-0" />
          <div className="h-4 w-full rounded bg-neutral-800" />
          <div className="mx-auto h-4 w-2/3 rounded bg-neutral-800 sm:mx-0" />
        </div>
      </div>
      <div className="mt-8 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-4 rounded bg-neutral-800" />
        ))}
      </div>
    </div>
  );
}
