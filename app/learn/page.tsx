import type { Metadata } from "next";
import BackLink from "@/components/BackLink";
import LearnQuiz from "@/components/LearnQuiz";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Learn to spot scams · FinGuard",
  description: "Four messages like the ones scammers really send. Pick what you'd do, then see why.",
};

export default function LearnPage() {
  return (
    <PageShell header={<BackLink />}>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Learn to spot scams</h1>
      <p className="mt-2 leading-relaxed text-neutral-400">
        Four messages like the ones scammers really send. Pick what you&apos;d do, then see why.
      </p>
      <LearnQuiz />
    </PageShell>
  );
}
