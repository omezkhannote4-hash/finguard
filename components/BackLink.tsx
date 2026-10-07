import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";

// The header's way home on every page except the home page.
export default function BackLink() {
  return (
    <Link
      href="/"
      className="-ml-2 inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-2 text-sm font-medium text-neutral-300 transition-colors hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <ArrowLeftIcon className="h-4 w-4" />
      Back to FinGuard
    </Link>
  );
}
