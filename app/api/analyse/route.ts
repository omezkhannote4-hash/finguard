import { NextResponse } from "next/server";
import { fail, groqChat, TEXT_MODEL } from "@/lib/groq";
import { languageName } from "@/lib/languages";
import { normaliseAnalysis } from "@/lib/normalise";

const MAX_MESSAGE_LENGTH = 5000;

// Gives a slow model reply time to finish before Vercel stops the function.
export const maxDuration = 30;

function systemPrompt(language: string) {
  return `You are a financial scam risk analyser for Indian users.
Analyse the user's message and return ONLY valid JSON:

{
  "risk_score": 0-100,
  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "scam_type": "KYC Phishing" | "Lottery" | "Fake Investment" | "Job Scam" | "Loan Scam" | "Customer Care Impersonation" | "UPI/QR Scam" | "Not a scam",
  "dna": [{"signal":"Urgency","detected":true}, ...],
  "flagged_phrases": ["exact substrings copied verbatim from the input"],
  "why": ["short reason 1","reason 2","reason 3"],
  "simple": "one sentence an average person understands",
  "action": ["step 1","step 2","step 3"]
}

Signals to check: Urgency, Threat, Impersonation, Suspicious Link,
OTP/PIN Request, Unrealistic Reward, Payment Request.

Weights: OTP request 30, suspicious link 25, impersonation 20,
threat 15, urgency 10, unrealistic reward 20, payment request 10.
Cap at 100.

CRITICAL: Genuine bank transaction alerts, OTP delivery messages and
balance updates are NOT scams. Score them under 20 and set
scam_type "Not a scam". Never flag a legitimate message.

Input may be English, Hindi, Kannada, Malayalam, Tamil, Telugu or mixed.
Write "why", "simple" and "action" in ${language}. Keep risk_level,
scam_type and the signal names in English exactly as listed above, and
copy flagged_phrases verbatim from the input without translating them.
Never claim certainty — this is a risk estimate.`;
}

export async function POST(request: Request) {
  let body: { message?: unknown; language?: unknown } | null;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Send JSON like {"message": "..."}.');
  }

  const message = body?.message;
  if (typeof message !== "string" || !message.trim()) {
    return fail(400, '"message" must be a non-empty string.');
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return fail(413, `"message" must be at most ${MAX_MESSAGE_LENGTH} characters.`);
  }

  const reply = await groqChat({
    model: TEXT_MODEL,
    messages: [
      { role: "system", content: systemPrompt(languageName(body?.language)) },
      { role: "user", content: message },
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
  const analysis = normaliseAnalysis(raw, message);
  if (!analysis) {
    return fail(502, "The model returned JSON in an unexpected shape.", reply.text.slice(0, 300));
  }
  return NextResponse.json(analysis);
}
