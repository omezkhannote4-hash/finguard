// What the user can check on the home page. `promptLine` is added to the
// analysis system prompt; Message adds nothing, so its prompt is unchanged.
export const INPUT_TYPES = [
  {
    id: "message",
    label: "Message",
    heading: "Paste the SMS, WhatsApp or email you received",
    placeholder:
      "e.g. Dear customer, your KYC has expired and your account will be blocked today. Update now: http://…",
    promptLine: "",
  },
  {
    id: "url",
    label: "URL",
    heading: "Paste the link you want to check",
    placeholder: "e.g. http://sbi-kyc-update.in/verify",
    promptLine:
      "The input is a website link (URL) the user wants to check. Judge the domain itself: misspellings, lookalike bank or brand names, odd endings and link shorteners.",
  },
  {
    id: "phone",
    label: "Phone",
    heading: "Enter the phone number that contacted you",
    placeholder: "e.g. +91 98765 43210",
    promptLine:
      "The input is a phone number the user wants to check. You cannot look numbers up, so judge only its format and any text with it, and say that a number alone can't prove who is calling.",
  },
  {
    id: "upi",
    label: "UPI",
    heading: "Enter the UPI ID you were asked to pay",
    placeholder: "e.g. sbi.refund.desk@ybl",
    promptLine:
      "The input is a UPI ID the user was asked to pay. Judge handles that pretend to be a bank, government body, courier or brand, and say that a UPI ID alone can't prove who owns it.",
  },
  {
    id: "email",
    label: "Email",
    heading: "Paste the email you received, with the sender",
    placeholder: "e.g. From: alerts@hdfc-secure-verify.com — Your net banking is locked…",
    promptLine:
      "The input is an email the user received. Check the sender's address, links, attachments and what it asks for.",
  },
] as const;

export type InputTypeId = (typeof INPUT_TYPES)[number]["id"];
