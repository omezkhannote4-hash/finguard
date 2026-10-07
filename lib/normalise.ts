import { RISK_LEVELS, SCAM_TYPES, SIGNALS, type Analysis } from "@/lib/analysis";

function pick<T extends string>(options: readonly T[], value: unknown): T | undefined {
  const wanted = String(value ?? "").trim().toLowerCase();
  return options.find((option) => option.toLowerCase() === wanted);
}

// The seven signals start with different letters ("urg", "thr", "otp", …), so
// small naming slips like "OTP Request" or "Threats" still match.
function stem(signal: unknown) {
  return String(signal ?? "").toLowerCase().replace(/[^a-z]/g, "").slice(0, 3);
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "")
    : [];
}

// Same bands as the risk meter; only used if the model's own level is invalid.
function levelFor(score: number): Analysis["risk_level"] {
  if (score < 30) return "LOW";
  if (score < 60) return "MEDIUM";
  if (score <= 80) return "HIGH";
  return "CRITICAL";
}

// JSON mode guarantees valid JSON but not this exact shape, so check every
// field and repair small slips before the result reaches the page.
// `source` is the text the model analysed; flagged phrases must appear in it.
export function normaliseAnalysis(raw: unknown, source: string): Analysis | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const score = Number(r.risk_score);
  const scamType = pick(SCAM_TYPES, r.scam_type);
  if (!Number.isFinite(score) || !scamType || typeof r.simple !== "string") return null;
  const riskScore = Math.min(100, Math.max(0, Math.round(score)));

  const detected = new Set(
    (Array.isArray(r.dna) ? r.dna : [])
      .filter((d) => d?.detected === true || d?.detected === "true")
      .map((d) => stem(d?.signal)),
  );

  // Flagged phrases must really appear in the source (ignoring case) so the page can highlight them.
  const lowerSource = source.toLowerCase();

  return {
    risk_score: riskScore,
    risk_level: pick(RISK_LEVELS, r.risk_level) ?? levelFor(riskScore),
    scam_type: scamType,
    dna: SIGNALS.map((signal) => ({ signal, detected: detected.has(stem(signal)) })),
    flagged_phrases: strings(r.flagged_phrases).filter((phrase) =>
      lowerSource.includes(phrase.toLowerCase()),
    ),
    why: strings(r.why),
    simple: r.simple,
    action: strings(r.action),
  };
}
