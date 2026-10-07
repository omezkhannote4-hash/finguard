// The practice scenarios on /learn. Each has three options and exactly one safe
// one. Their text is in lib/i18n.ts under learn.<id>.topic, from, message,
// o1–o3 and explanation; safe is the index of the safe option.
export const SCENARIOS = [
  { id: "kyc", safe: 2 },
  { id: "lottery", safe: 0 },
  { id: "job", safe: 1 },
  { id: "upi", safe: 2 },
] as const;

export const OPTIONS = ["o1", "o2", "o3"] as const;
