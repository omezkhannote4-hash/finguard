import { NextResponse } from "next/server";
import { fail, groqChat, VISION_MODEL } from "@/lib/groq";

const MAX_MESSAGE_LENGTH = 5000;
// The page shrinks screenshots well below this; Vercel rejects request bodies over 4.5 MB.
const MAX_IMAGE_LENGTH = 4_000_000;
const DATA_URL_PREFIX = /^data:image\/(png|jpeg|webp);base64,/;

export const maxDuration = 30;

const PROMPT = `Read this screenshot of a message someone received (SMS, WhatsApp, email or similar).
Return JSON like {"text": "..."} with the message text exactly as written, keeping line breaks,
links, numbers and the sender if shown. Don't translate, summarise or correct anything.
Leave out phone status bars, app buttons and anything that isn't part of the message.
If there's no readable message text, return {"text": ""}.`;

// Reads the text out of a screenshot so it can be analysed like a pasted message.
export async function POST(request: Request) {
  let body: { image?: unknown } | null;
  try {
    body = await request.json();
  } catch {
    return fail(400, 'Send JSON like {"image": "data:image/jpeg;base64,..."}.');
  }

  const image = body?.image;
  if (typeof image !== "string" || !DATA_URL_PREFIX.test(image.slice(0, 40))) {
    return fail(400, '"image" must be a PNG, JPEG or WebP data URL.');
  }
  if (image.length > MAX_IMAGE_LENGTH) {
    return fail(413, "That image is too large. Try a smaller screenshot.");
  }

  const reply = await groqChat({
    model: VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: PROMPT },
          { type: "image_url", image_url: { url: image } },
        ],
      },
    ],
    response_format: { type: "json_object" },
    reasoning_effort: "none",
    max_completion_tokens: 4096,
  });
  if ("error" in reply) return reply.error;

  let text = "";
  try {
    const parsed = JSON.parse(reply.text);
    text = typeof parsed?.text === "string" ? parsed.text.trim() : "";
  } catch {
    return fail(502, "The model returned malformed JSON. Try again.", reply.text.slice(0, 300));
  }
  if (!text) return fail(422, "No text found in that image.");

  return NextResponse.json({ text: text.slice(0, MAX_MESSAGE_LENGTH) });
}
