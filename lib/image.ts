// Shrinks a picked image into a JPEG data URL that uploads quickly and stays
// well under Vercel's 4.5 MB request limit. Throws if the browser can't open it.
const ATTEMPTS = [
  { maxPixels: 2_500_000, quality: 0.85 },
  { maxPixels: 1_200_000, quality: 0.7 },
];
const MAX_DATA_URL_LENGTH = 3_000_000;

export async function imageToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    for (const { maxPixels, quality } of ATTEMPTS) {
      // Scale by area rather than longest side, so tall phone screenshots stay readable.
      const scale = Math.min(1, Math.sqrt(maxPixels / (bitmap.width * bitmap.height)));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas isn't available");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= MAX_DATA_URL_LENGTH) return dataUrl;
    }
    throw new Error("Image is too large");
  } finally {
    bitmap.close();
  }
}
