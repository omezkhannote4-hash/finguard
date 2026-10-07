// Hand-written example results for the demo presets (not Gemini output).
// An unedited preset shows its result from here without calling the API.
// Scores follow the system prompt's weighted rubric, and every flagged phrase
// is copied verbatim from its preset in presets.json.
// `npm run capture-fallbacks` replaces these with real Gemini responses.
import type { Analysis } from "./analysis";

export const PRESET_FALLBACKS: Partial<Record<string, Analysis>> = {
  // Urgency 10 + Threat 15 + Impersonation 20 + Suspicious Link 25 + OTP/PIN Request 30 = 100
  kyc: {
    risk_score: 100,
    risk_level: "CRITICAL",
    scam_type: "KYC Phishing",
    dna: [
      { signal: "Urgency", detected: true },
      { signal: "Threat", detected: true },
      { signal: "Impersonation", detected: true },
      { signal: "Suspicious Link", detected: true },
      { signal: "OTP/PIN Request", detected: true },
      { signal: "Unrealistic Reward", detected: false },
      { signal: "Payment Request", detected: false },
    ],
    flagged_phrases: [
      "BLOCKED today",
      "Update your PAN immediately",
      "http://sbi-kyc-update.in",
      "to avoid suspension",
      "Share the OTP sent to your mobile",
    ],
    why: [
      "SBI never asks you to update KYC or PAN through a link in an SMS, and this link isn't an official SBI website.",
      "It threatens to block your account today so you act before you think.",
      "It asks you to share an OTP. No real bank employee will ever ask for one.",
    ],
    simple: "This looks like a fake SBI message trying to steal your bank login and OTP.",
    action: [
      "Don't click the link or reply to the message.",
      "Never share your OTP, PIN or password with anyone, even someone who says they're from SBI.",
      "If you already shared details, call SBI on the number on the back of your card and report it on 1930 or at cybercrime.gov.in.",
    ],
  },

  // Urgency 10 + Impersonation 20 + Unrealistic Reward 20 + Payment Request 10 = 60
  lottery: {
    risk_score: 60,
    risk_level: "HIGH",
    scam_type: "Lottery",
    dna: [
      { signal: "Urgency", detected: true },
      { signal: "Threat", detected: false },
      { signal: "Impersonation", detected: true },
      { signal: "Suspicious Link", detected: false },
      { signal: "OTP/PIN Request", detected: false },
      { signal: "Unrealistic Reward", detected: true },
      { signal: "Payment Request", detected: true },
    ],
    flagged_phrases: [
      "Your mobile number has won Rs 25,00,000",
      "KBC Jio Lucky Draw 2026",
      "pay a processing fee of Rs 12,500",
      "kbclottery2026@ybl",
      "send your Aadhaar photo on WhatsApp",
      "Offer valid for 24 hours only",
    ],
    why: [
      "You can't win a draw you never entered. Fake KBC lottery messages are a well-known scam.",
      "Real prizes never ask you to pay a 'processing fee' to collect them.",
      "It wants a photo of your Aadhaar, which can be misused, and gives you only 24 hours to rush you.",
    ],
    simple: "This looks like a fake lottery message trying to get you to pay a fee and share your Aadhaar.",
    action: [
      "Don't pay anything, and don't send your Aadhaar or any other ID.",
      "Block the sender and delete the message.",
      "If you already paid, report it on 1930 or at cybercrime.gov.in and tell your bank straight away.",
    ],
  },

  // Urgency 10 + Impersonation 20 + Suspicious Link 25 + Unrealistic Reward 20 + Payment Request 10 = 85
  investment: {
    risk_score: 85,
    risk_level: "CRITICAL",
    scam_type: "Fake Investment",
    dna: [
      { signal: "Urgency", detected: true },
      { signal: "Threat", detected: false },
      { signal: "Impersonation", detected: true },
      { signal: "Suspicious Link", detected: true },
      { signal: "OTP/PIN Request", detected: false },
      { signal: "Unrealistic Reward", detected: true },
      { signal: "Payment Request", detected: true },
    ],
    flagged_phrases: [
      "Zerodha VIP Stock Club",
      "made 300% returns last month",
      "Invest just ₹10,000 today",
      "guaranteed ₹50,000 in 7 days, zero risk",
      "Only 5 seats left!",
      "https://vip-stock-club.in/join",
    ],
    why: [
      "No real investment can promise five times your money in 7 days with zero risk.",
      "It borrows Zerodha's name to look trustworthy, a common trick in WhatsApp stock-tip scams.",
      "'Only 5 seats left' is pressure to make you pay before you check anything.",
    ],
    simple: "This looks like a fake investment scheme designed to take your money.",
    action: [
      "Don't pay, and don't join the WhatsApp group.",
      "Only invest through a SEBI-registered broker, using its official app or website.",
      "If you already paid, report it on 1930 or at cybercrime.gov.in and tell your bank straight away.",
    ],
  },

  // Genuine bank alert: no signals, so under 20 and "Not a scam".
  hdfc: {
    risk_score: 5,
    risk_level: "LOW",
    scam_type: "Not a scam",
    dna: [
      { signal: "Urgency", detected: false },
      { signal: "Threat", detected: false },
      { signal: "Impersonation", detected: false },
      { signal: "Suspicious Link", detected: false },
      { signal: "OTP/PIN Request", detected: false },
      { signal: "Unrealistic Reward", detected: false },
      { signal: "Payment Request", detected: false },
    ],
    flagged_phrases: [],
    why: [
      "It follows HDFC Bank's usual UPI debit alert format: amount, masked account number, payee, date and reference number.",
      "It doesn't ask you to click a link, share an OTP or PIN, or pay anything.",
      "The 'Not You?' line only explains how to block UPI if you didn't make this payment.",
    ],
    simple: "This looks like a genuine HDFC Bank alert for a ₹1,250 payment to Swiggy.",
    action: [
      "If you made this payment, you don't need to do anything.",
      "If you didn't, block UPI straight away in the HDFC Bank app or by calling the number on the back of your card.",
      "Never share an OTP or PIN with anyone who calls you about this payment.",
    ],
  },
};
