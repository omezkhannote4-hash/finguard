// The shape /api/analyse returns. Shared by the API route and the UI.

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const SCAM_TYPES = [
  "KYC Phishing",
  "Lottery",
  "Fake Investment",
  "Job Scam",
  "Loan Scam",
  "Customer Care Impersonation",
  "UPI/QR Scam",
  "Not a scam",
] as const;

export const SIGNALS = [
  "Urgency",
  "Threat",
  "Impersonation",
  "Suspicious Link",
  "OTP/PIN Request",
  "Unrealistic Reward",
  "Payment Request",
] as const;

export type Analysis = {
  risk_score: number;
  risk_level: (typeof RISK_LEVELS)[number];
  scam_type: (typeof SCAM_TYPES)[number];
  dna: { signal: (typeof SIGNALS)[number]; detected: boolean }[];
  flagged_phrases: string[];
  why: string[];
  simple: string;
  action: string[];
};
