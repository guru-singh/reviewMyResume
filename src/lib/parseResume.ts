import pdf from "pdf-parse";
import mammoth from "mammoth";

export async function extractTextFromResume(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  const buf = Buffer.from(ab);
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const out = await pdf(buf);
    return normalizeText(out.text);
  }

  if (name.endsWith(".docx")) {
    const out = await mammoth.extractRawText({ buffer: buf });
    return normalizeText(out.value);
  }

  // .doc is not reliably supported without external converters.
  // Keep MVP strict: PDF/DOCX.
  throw new Error("Unsupported file type. Please upload PDF or DOCX.");
}

function normalizeText(t: string) {
  return t
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
