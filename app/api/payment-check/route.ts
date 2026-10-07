import { NextResponse } from "next/server";
import { fail, groqChat, TEXT_MODEL } from "@/lib/groq";
import { languageName } from "@/lib/languages";
import { normaliseAnalysis } from "@/lib/normalise";

const MAX_AMOUNT = 1_000_000_000;
const MAX_REASON_LENGTH = 300;

export const maxDuration = 30;

// Same JSON schema as /api/analyse, but scoring the payment rather than a message.
function systemPrompt(language: string) {
  return `You are a payment safety checker for Indian users. Before sending money,
the user answers a short checklist. Score the risk that this payment is part of
a scam and return ONLY valid JSON:

{
  "risk_score": 0-100,
  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "scam_type": "KYC Phishing" | "Lottery" | "Fake Investment" | "Job Scam" | "Loan Scam" | "Customer Care Impersonation" | "UPI/QR Scam" | "Not a scam",
  "dna": [{"signal":"Urgency","detected":true}, ...],
  "flagged_phrases": ["exact substrings copied verbatim from the reason"],
  "why": ["short reason 1","reason 2","reason 3"],
  "simple": "one sentence an average person understands",
  "action": ["step 1","step 2","step 3"]
}

Signals to check: Urgency, Threat, Impersonation, Suspicious Link,
OTP/PIN Request, Unrealistic Reward, Payment Request.
Urgency is detected if someone created urgency. Suspicious Link is detected
if a link or QR code was involved. Judge the other signals from the reason.

Score payment risk, not message risk:
new recipient 20, someone created urgency 20, link or QR code involved 20,
amount of ₹10,000 or more 10 (₹50,000 or more 20 instead), and a reason
that matches a scam pattern 30: a fee to receive a prize, refund, loan or
job; guaranteed or very high returns; someone claiming to be a bank, police,
courier or customer care; paying to "verify", "unlock" or "activate" an
account; scanning a QR code or entering a UPI PIN to receive money.
Cap at 100.

CRITICAL: Ordinary payments to people or businesses the user already knows
(rent, bills, shopping, family), with no urgency and no link or QR code,
are NOT scams. Score them under 20 and set scam_type "Not a scam". For a
risky payment, pick the closest scam_type.

"action" lists what to do before paying, such as checking the recipient
through a number you already trust, waiting, or not paying at all.
1930 is India's national cyber fraud helpline, not a bank's number; to reach
their bank, they should use the number on their card or the bank's official app.
Write "why", "simple" and "action" in ${language}. Keep risk_level,
scam_type and the signal names in English exactly as listed above, and
copy flagged_phrases verbatim from the reason without translating them.
Never claim certainty — this is a risk estimate.`;
}

const yesNo = (value: boolean) => (value ? "Yes" : "No");

export async function POST(request: Request) {
  let body: {
    amount?: unknown;
    newRecipient?: unknown;
    urgency?: unknown;
    linkOrQr?: unknown;
    reason?: unknown;
    language?: unknown;
  } | null;
  try {
    body = await request.json();
  } catch {
    return fail(400, "Send the checklist answers as JSON.");
  }

  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return fail(400, '"amount" must be a positive number of rupees.');
  }
  const { newRecipient, urgency, linkOrQr } = body ?? {};
  if (
    typeof newRecipient !== "boolean" ||
    typeof urgency !== "boolean" ||
    typeof linkOrQr !== "boolean"
  ) {
    return fail(400, '"newRecipient", "urgency" and "linkOrQr" must be true or false.');
  }
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (reason.length > MAX_REASON_LENGTH) {
    return fail(413, `"reason" must be at most ${MAX_REASON_LENGTH} characters.`);
  }

  const answers = [
    `Amount: ₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(amount)}`,
    `New recipient: ${yesNo(newRecipient)}`,
    `Someone created urgency: ${yesNo(urgency)}`,
    `Link or QR code involved: ${yesNo(linkOrQr)}`,
    `Reason for payment: ${reason || "(not given)"}`,
  ].join("\n");

  const reply = await groqChat({
    model: TEXT_MODEL,
    messages: [
      { role: "system", content: systemPrompt(languageName(body?.language)) },
      { role: "user", content: answers },
    ],
    response_format: { type: "json_object" },
    reasoning_effort: "low",
    include_reasoning: false,
    max_completion_tokens: 4096,
  });
  if ("error" in reply) return reply.error;

  let raw: unknown;
  try {
    raw = JSON.parse(reply.text);
  } catch {
    return fail(502, "The model returned malformed JSON. Try again.", reply.text.slice(0, 300));
  }
  const analysis = normaliseAnalysis(raw, reason);
  if (!analysis) {
    return fail(502, "The model returned JSON in an unexpected shape.", reply.text.slice(0, 300));
  }
  return NextResponse.json(analysis);
}
