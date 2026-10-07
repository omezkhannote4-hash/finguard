import { NextResponse } from "next/server";
import { RISK_LEVELS, SCAM_TYPES, SIGNALS, type Analysis } from "@/lib/analysis";

// gemini-2.0-flash was shut down on 1 June 2026; this is Google's listed replacement.
const MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_MESSAGE_LENGTH = 5000;

// Gives a slow Gemini reply time to finish before Vercel stops the function.
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a financial scam risk analyser for Indian users.
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

Input may be English, Hindi, Kannada or mixed. Reply in the same language.
Never claim certainty — this is a risk estimate.`;

// Gemini's structured output: the reply must be JSON in exactly this shape.
// The enums stay in English even when the explanation is in Hindi or Kannada.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    risk_score: { type: "INTEGER" },
    risk_level: { type: "STRING", enum: RISK_LEVELS },
    scam_type: { type: "STRING", enum: SCAM_TYPES },
    dna: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          signal: { type: "STRING", enum: SIGNALS },
          detected: { type: "BOOLEAN" },
        },
        required: ["signal", "detected"],
      },
    },
    flagged_phrases: { type: "ARRAY", items: { type: "STRING" } },
    why: { type: "ARRAY", items: { type: "STRING" } },
    simple: { type: "STRING" },
    action: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: [
    "risk_score",
    "risk_level",
    "scam_type",
    "dna",
    "flagged_phrases",
    "why",
    "simple",
    "action",
  ],
};

type GeminiResponse = {
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

// `detail` (Gemini's own error text) is only included while developing locally.
function fail(status: number, error: string, detail?: string) {
  const showDetail = detail && process.env.NODE_ENV === "development";
  return NextResponse.json(showDetail ? { error, detail } : { error }, {
    status,
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Send JSON like {"message": "..."}.');
  }

  const message = (body as { message?: unknown } | null)?.message;
  if (typeof message !== "string" || !message.trim()) {
    return fail(400, '"message" must be a non-empty string.');
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return fail(413, `"message" must be at most ${MAX_MESSAGE_LENGTH} characters.`);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return fail(500, "The server is missing GEMINI_API_KEY.");
  }

  let res: Response;
  try {
    res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: message }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch (err) {
    console.error("Gemini request failed:", err);
    if ((err as Error)?.name === "TimeoutError") {
      return fail(504, "Gemini took too long to respond. Try again.");
    }
    return fail(502, "Could not reach Gemini.");
  }

  const data: GeminiResponse | null = await res.json().catch(() => null);

  if (!res.ok) {
    const detail = data?.error?.message;
    console.error(`Gemini error ${res.status}: ${detail}`);
    if (res.status === 429) {
      return fail(429, "Too many requests to Gemini. Wait a minute and try again.", detail);
    }
    if (res.status === 401 || res.status === 403) {
      return fail(502, "Gemini rejected the API key. Check GEMINI_API_KEY.", detail);
    }
    return fail(502, `Gemini returned an error (HTTP ${res.status}).`, detail);
  }

  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts
    ?.filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("");
  if (!text) {
    const reason = data?.promptFeedback?.blockReason ?? candidate?.finishReason;
    return fail(502, "Gemini returned no analysis. Try again.", reason);
  }

  let analysis: Analysis;
  try {
    analysis = JSON.parse(text);
  } catch {
    return fail(502, "Gemini returned malformed JSON.", text.slice(0, 300));
  }
  const lists = [analysis?.dna, analysis?.flagged_phrases, analysis?.why, analysis?.action];
  if (typeof analysis?.risk_score !== "number" || !lists.every(Array.isArray)) {
    return fail(502, "Gemini returned JSON in an unexpected shape.", text.slice(0, 300));
  }

  // Enforce two promises the UI relies on: a 0–100 score, and flagged phrases
  // that really appear in the message, ignoring case (so they can be highlighted).
  analysis.risk_score = Math.min(100, Math.max(0, Math.round(analysis.risk_score)));
  const lowerMessage = message.toLowerCase();
  analysis.flagged_phrases = analysis.flagged_phrases.filter(
    (phrase) => phrase && lowerMessage.includes(phrase.toLowerCase()),
  );

  return NextResponse.json(analysis);
}
