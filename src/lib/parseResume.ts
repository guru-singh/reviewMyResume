import pdf from "pdf-parse";
import mammoth from "mammoth";

export async function extractTextFromResume(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  const buf = Buffer.from(ab);
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const out = await pdf(buf);
    return normalizeText(out.text);
    // console.log('****************** PDF Text Extracted ********************');
    // console.log('PDF Text Extracted:', out.text);
    // console.log('****************** PDF Text Extracted ********************');
    return (out.text);
  }

  if (name.endsWith(".docx")) {
    const out = await mammoth.extractRawText({ buffer: buf });
    return normalizeText(out.value);
    return (out.value);
  }

  throw new Error("Unsupported file type. Please upload PDF or DOCX.");
}

function normalizeText(t: string) {
  return t
    // normalize line endings
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")

    // remove null bytes
    .replace(/\u0000/g, "")

    // remove control chars except newline/tab
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")

    // remove lone surrogate pairs (BIG cause)
    .replace(/[\uD800-\uDFFF]/g, "")

    // remove malformed unicode escapes
    .replace(/\\u(?![0-9a-fA-F]{4})/g, "")

    // collapse extra newlines
    .replace(/\n{3,}/g, "\n\n")

    .trim();
}