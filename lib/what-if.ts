// The what-if simulator's suggested scenarios, plus saved consequence chains it
// shows for them when a live scenario can't be run.
import type { ScamType } from "./analysis";

export type WhatIfKey = "link" | "pay" | "otp";
export type WhatIf = Record<WhatIfKey, string[]>;

// The suggested scenarios. Their chip text (whatif.chip.*) and the advice shown
// with a saved chain (whatif.advice.*) are in lib/i18n.ts.
export const WHAT_IF_CHIPS: WhatIfKey[] = ["link", "pay", "otp"];

// How each kind of scam usually unfolds: a scenario, not a prediction. These
// saved chains are English only; they appear only when Groq can't be reached.
// "Not a scam" has no entry, so genuine messages get no saved scare chains.
export const WHAT_IF: Partial<Record<ScamType, WhatIf>> = {
  "KYC Phishing": {
    link: [
      "A fake bank page opens, made to look real",
      "It asks for your login, card or Aadhaar details",
      "Everything you type goes straight to the scammers",
      "They log in as you and move your money out",
    ],
    pay: [
      "You pay a small 'KYC fee' or 'penalty'",
      "It goes to a scammer's account, not your bank",
      "New 'charges' follow, each one urgent",
      "Money sent this way is very hard to get back",
    ],
    otp: [
      "The OTP approves a login or payment they started",
      "Money can leave your account within seconds",
      "They may register your account on their own phone",
      "Withdrawals continue until the account is frozen",
    ],
  },
  Lottery: {
    link: [
      "A 'claim your prize' page opens",
      "It asks for bank details, ID and a fee",
      "Your details are misused or sold on",
      "There is no prize at the end",
    ],
    pay: [
      "You pay a 'processing fee' or 'tax' to claim",
      "Another charge appears, then another",
      "Each payment goes to a different account",
      "No prize arrives and the money is gone",
    ],
    otp: [
      "They say the OTP is needed to send your prize",
      "It actually approves a payment from your account",
      "Money goes out to them, not in to you",
      "They come back for more with a new excuse",
    ],
  },
  "Fake Investment": {
    link: [
      "A trading app or WhatsApp 'VIP group' opens",
      "It shows fake profits to win your trust",
      "You're pushed to deposit more and more",
      "Withdrawals are blocked by new 'fees'",
    ],
    pay: [
      "Your first deposit shows quick 'profits'",
      "You're urged to invest a bigger amount",
      "Withdrawing needs a 'tax' or 'unlock fee' first",
      "The platform vanishes with everything you put in",
    ],
    otp: [
      "The OTP lets them into your bank or trading account",
      "They move your money or take loans in your name",
      "You can lose more than you ever invested",
    ],
  },
  "Job Scam": {
    link: [
      "A fake job or 'task' portal opens",
      "It asks for ID documents and bank details",
      "Your ID can be misused for loans or SIM cards",
      "Your account may be used to move stolen money",
    ],
    pay: [
      "You pay a 'registration' or 'training' fee",
      "Small 'task' payouts arrive to win your trust",
      "Bigger tasks need bigger deposits",
      "Your deposits get locked and the job disappears",
    ],
    otp: [
      "The OTP gives them control of your bank account",
      "They use it to pass on money stolen from others",
      "Police can freeze your account during the investigation",
    ],
  },
  "Loan Scam": {
    link: [
      "An instant-loan app or page opens",
      "It asks to access your contacts and photos",
      "Hidden fees are charged before any loan",
      "Threatening calls to you and your contacts can follow",
    ],
    pay: [
      "You pay a 'processing' or 'insurance' fee up front",
      "The loan is delayed by 'one more charge'",
      "The loan never arrives",
      "Every fee you paid is gone",
    ],
    otp: [
      "The OTP approves a loan or payment in your name",
      "You may owe money you never received",
      "It can damage your credit score",
    ],
  },
  "Customer Care Impersonation": {
    link: [
      "A 'support' page or app download opens",
      "It may install a screen-sharing app like AnyDesk",
      "They watch your screen while you log in",
      "They see your PIN and move money out",
    ],
    pay: [
      "You pay a small amount to 'verify' or 'get a refund'",
      "They say it will be returned at once",
      "They ask you to try again, and again",
      "Nothing is refunded and the money is gone",
    ],
    otp: [
      "They say the OTP will 'process your refund'",
      "It actually approves a payment from your account",
      "Money goes out instead of coming in",
      "They may call back to 'fix it' and take more",
    ],
  },
  "UPI/QR Scam": {
    link: [
      "A UPI app opens with a payment request",
      "It looks like you're about to receive money",
      "Approving it sends money from your account",
      "UPI payments are instant and hard to reverse",
    ],
    pay: [
      "You scan their QR code or accept their request",
      "You enter your UPI PIN to 'receive' money",
      "A UPI PIN only ever sends money, never receives it",
      "The amount leaves your account instantly",
    ],
    otp: [
      "The OTP lets them set up UPI on their phone",
      "Your bank account is now linked to their app",
      "They can send your money out without asking",
      "Payments continue until you block UPI",
    ],
  },
};
