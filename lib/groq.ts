// Server-side helper for Groq's OpenAI-compatible chat completions API.
// Every model call in FinGuard goes through here.
import { NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Groq shut down llama-3.3-70b-versatile for free and developer accounts on
// 16 Aug 2026 and recommends GPT-OSS 120B instead.
export const TEXT_MODEL = "openai/gpt-oss-120b";

// Groq's only model that reads images. It's a preview model, which Groq says
// may be discontinued at short notice.
export const VISION_MODEL = "qwen/qwen3.8-27b";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type GroqRequest = {
  model: string;
  messages: { role: "system" | "user"; content: string | ContentPart[] }[];
  response_format?: { type: "json_object" };
  reasoning_effort?: "none" | "low" | "medium" | "high";
  include_reasoning?: boolean;
  max_completion_tokens?: number;
};

type GroqResponse = {
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
  error?: { message?: string; code?: string };
};

// `detail` (Groq's own error text) is only included while developing locally.
export function fail(status: number, error: string, detail?: string) {
  const showDetail = detail && process.env.NODE_ENV === "development";
  return NextResponse.json(showDetail ? { error, detail } : { error }, { status });
}

// Sends one chat request to Groq. Returns the reply text, or an error response
// that the route can send straight back to the browser.
export async function groqChat(
  request: GroqRequest,
): Promise<{ text: string } | { error: NextResponse }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is not set");
    return { error: fail(500, "The server is missing GROQ_API_KEY.") };
  }

  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(25_000),
    });
  } catch (err) {
    console.error("Groq request failed:", err);
    if ((err as Error)?.name === "TimeoutError") {
      return { error: fail(504, "The model took too long to respond. Try again.") };
    }
    return { error: fail(502, "Could not reach Groq.") };
  }

  const data: GroqResponse | null = await res.json().catch(() => null);

  if (!res.ok) {
    const detail = data?.error?.message;
    console.error(`Groq error ${res.status} (${request.model}): ${detail}`);
    if (res.status === 401 || res.status === 403) {
      return { error: fail(502, "Groq rejected the API key. Check GROQ_API_KEY.", detail) };
    }
    if (res.status === 429) {
      return { error: fail(429, "Too many requests to Groq. Wait a minute and try again.", detail) };
    }
    if (data?.error?.code === "json_validate_failed") {
      return { error: fail(502, "The model returned malformed JSON. Try again.", detail) };
    }
    return { error: fail(502, `Groq returned an error (HTTP ${res.status}).`, detail) };
  }

  const choice = data?.choices?.[0];
  const text = choice?.message?.content?.trim();
  if (!text) {
    return { error: fail(502, "The model returned an empty reply. Try again.", choice?.finish_reason) };
  }
  return { text };
}
