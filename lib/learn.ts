// The practice scenarios on /learn. Each has exactly one safe option.
export type Scenario = {
  id: string;
  topic: string;
  from: string;
  message: string;
  options: { text: string; safe: boolean }[];
  explanation: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "kyc",
    topic: "KYC phishing",
    from: "SMS from VK-SBIUPD",
    message:
      "Dear Customer, your SBI YONO account will be blocked today due to pending KYC. Update your PAN now: http://sbi-yono-kyc.in/update",
    options: [
      { text: "Tap the link and update my PAN before the account is blocked.", safe: false },
      { text: "Reply to the SMS to ask whether it's genuine.", safe: false },
      {
        text: "Ignore the link, and check in the official YONO app or by calling the number on my card.",
        safe: true,
      },
    ],
    explanation:
      "Banks don't send KYC links by SMS, and sbi-yono-kyc.in isn't an SBI website: the page would capture your login and OTP. Replying only tells scammers your number is active. Check through the official app or the number printed on your card.",
  },
  {
    id: "lottery",
    topic: "Lottery prize",
    from: "WhatsApp from an unknown number",
    message:
      "Congratulations! Your number has won ₹25,00,000 in the KBC Lucky Draw. To release your prize, pay the ₹12,500 GST and processing fee to kbcprize@ybl within 24 hours.",
    options: [
      { text: "Don't pay. Block the number and report it.", safe: true },
      { text: "Pay the ₹12,500. It's small next to ₹25 lakh.", safe: false },
      { text: "Ask them to take the fee out of the prize money instead.", safe: false },
    ],
    explanation:
      "You can't win a draw you never entered, and real prizes never ask for a fee first. Pay once and another 'tax' or 'transfer charge' follows. Block and report the number, and if you've already paid, call 1930.",
  },
  {
    id: "job",
    topic: "Fake job offer",
    from: "WhatsApp from “Priya, HR team”",
    message:
      "Hi! Earn ₹3,000–8,000 a day from home by liking YouTube videos. Join our Telegram group to start: t.me/daily-tasks-in. A ₹499 registration fee activates your account.",
    options: [
      { text: "Pay the ₹499. If they pay me for the first task, it's real.", safe: false },
      {
        text: "Decline. Real jobs never charge a fee, and I'll look for openings on the company's official careers page.",
        safe: true,
      },
      { text: "Send my Aadhaar and bank details so they can set up my salary.", safe: false },
    ],
    explanation:
      "Task scams pay small amounts at first to earn your trust, then ask for bigger 'deposits' to unlock earnings you never get back. Real employers don't charge registration fees, and sharing your ID and bank details can get your account used to move stolen money.",
  },
  {
    id: "upi",
    topic: "UPI request",
    from: "Chat with a buyer on a marketplace app",
    message:
      "Hi, I'll buy your sofa for ₹15,000. I've sent you a QR code on WhatsApp. Scan it and enter your UPI PIN to receive the money. Please hurry, my tempo is on the way.",
    options: [
      { text: "Scan the QR code and enter my UPI PIN to receive the ₹15,000.", safe: false },
      { text: "Ask them to send a UPI payment request instead.", safe: false },
      {
        text: "Refuse. To receive money I only share my UPI ID. I never scan their code or enter my PIN.",
        safe: true,
      },
    ],
    explanation:
      "Your UPI PIN only ever sends money. Scanning a stranger's QR code, or approving their payment request with your PIN, moves money out of your account. To get paid, share your UPI ID or let the buyer scan your own QR code.",
  },
];
