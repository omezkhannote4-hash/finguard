import type { Metadata } from "next";
import BackLink from "@/components/BackLink";
import LanguageSelect from "@/components/LanguageSelect";
import PageShell from "@/components/PageShell";
import PaymentCheck from "@/components/PaymentCheck";
import T from "@/components/T";

export const metadata: Metadata = {
  title: "Before you pay · FinGuard",
  description:
    "A quick safety check before you send money: the amount, the recipient, any urgency, links or QR codes, and the reason.",
};

export default function BeforeYouPayPage() {
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
        <T k="header.beforeYouPay" />
      </h1>
      <p className="mt-2 leading-relaxed text-neutral-400">
        <T k="pay.intro" />
      </p>
      <PaymentCheck />
    </PageShell>
  );
}
