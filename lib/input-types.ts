// What the user can check on the home page. Their labels, headings and
// placeholders are in lib/i18n.ts under type.<id>.*. `promptLine` is added to
// the analysis system prompt; Message adds nothing, so its prompt is unchanged.
export const INPUT_TYPES = [
  { id: "message", promptLine: "" },
  {
    id: "url",
    promptLine:
      "The input is a website link (URL) the user wants to check. Judge the domain itself: misspellings, lookalike bank or brand names, odd endings and link shorteners.",
  },
  {
    id: "phone",
    promptLine:
      "The input is a phone number the user wants to check. You cannot look numbers up, so judge only its format and any text with it, and say that a number alone can't prove who is calling.",
  },
  {
    id: "upi",
    promptLine:
      "The input is a UPI ID the user was asked to pay. Judge handles that pretend to be a bank, government body, courier or brand, and say that a UPI ID alone can't prove who owns it.",
  },
  {
    id: "email",
    promptLine:
      "The input is an email the user received. Check the sender's address, links, attachments and what it asks for.",
  },
] as const;

export type InputTypeId = (typeof INPUT_TYPES)[number]["id"];
