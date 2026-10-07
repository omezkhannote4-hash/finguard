import Link from "next/link";
import T from "@/components/T";
import { ArrowLeftIcon } from "@/components/icons";

// The header's way home on every page except the home page. A long translation
// wraps onto a second line rather than pushing the language picker off screen.
export default function BackLink() {
  return (
    <Link
      href="/"
      className="-ml-2 inline-flex h-11 min-w-0 items-center gap-2 rounded-full px-2 text-sm font-medium leading-tight text-neutral-300 transition-colors hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <ArrowLeftIcon className="h-4 w-4 shrink-0" />
      <span className="min-w-0">
        <T k="nav.back" />
      </span>
    </Link>
  );
}
