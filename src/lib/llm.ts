import { mkdir, writeFile } from "fs/promises";
import path from "path";

type Provider = "gemini" | "claude";

function normalizeGeminiModel(model: string) {
  return model.replace(/^models\//, "");
}

// 🔥 Strong sanitizer (critical for your bug)
function sanitizeForLLM(input = "") {
  return input
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/\\u(?![0-9a-fA-F]{4})/g, "")
    .trim();
}

function buildPrompt(resumeText: string, jobDescription?: string) {
  return `You are an expert ATS resume reviewer.

Return ONLY HTML.
Do not return JSON.
Do not return markdown.
Do not include code fences.
Do not include any explanation before or after the HTML.

Return a single HTML report containing exactly these five sections in this order:
1. atsScore
2. keywordMatch
3. improvements
4. upgrades
5. quickWins

HTML requirements:
- Use semantic HTML only: section, h2, h3, p, ul, li, div, strong, span.
- Keep the HTML clean and renderable inside a single container.
- Put each section inside <section>.
- Use the section titles exactly as:
  - ATS Score
  - Keyword Match
  - Improvements
  - Upgrades
  - Quick Wins

Resume text:
"""
${resumeText}
"""

${jobDescription ? `Job description:
"""
${jobDescription}
"""` : "No job description provided."}
`;
}

async function writeProviderLog(
  provider: Provider,
  kind: "request" | "response",
  text: string
) {
  try {
    const dir = path.join(process.cwd(), ".llm-logs");
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${provider}-${kind}-latest.txt`);
    await writeFile(file, text, "utf8");
  } catch (error) {
    console.error(`[${provider} ${kind} log write failed]`, error);
  }
}

async function generateRawAnalysisText(
  provider: Provider,
  prompt: string
) {
  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    const apiVersion = process.env.GEMINI_API_VERSION || "v1beta";
    const model = normalizeGeminiModel(
      process.env.GEMINI_MODEL || "gemini-1.5-pro"
    );
    const isGemini25Pro = /^gemini-2\.5-pro/i.test(model);

    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 3200,
        responseMimeType: "text/plain",
        ...(isGemini25Pro
          ? { thinkingConfig: { thinkingBudget: 128 } }
          : {}),
      },
    };

    const payloadJson = JSON.stringify(payload);

    // 🔍 LOG REQUEST
    console.log("===== GEMINI REQUEST =====");
    console.log("Prompt length:", prompt.length);
    console.log("Prompt preview:", JSON.stringify(prompt).slice(0, 1000));
    console.log("Payload preview:", payloadJson.slice(0, 1000));

    await writeProviderLog("gemini", "request", payloadJson);

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payloadJson,
    });

    const rawText = await resp.text();

    // 🔍 LOG RESPONSE
    console.log("===== GEMINI RESPONSE =====");
    console.log("Status:", resp.status);
    console.log("Response preview:", rawText.slice(0, 1000));

    await writeProviderLog("gemini", "response", rawText);

    if (!resp.ok) {
      throw new Error(`Gemini error: ${resp.status} ${rawText}`);
    }

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch (error) {
      console.error("❌ Gemini JSON parse failed:", rawText);
      throw new Error("Failed to parse Gemini response");
    }

    const html =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text || "")
        .join("")
        .trim() || "";

    if (!html) {
      throw new Error("Gemini returned empty HTML");
    }

    return html;
  }

  throw new Error("Unsupported provider");
}

export async function analyzeResumeWithLLM({
  resumeText,
  jobDescription,
}: {
  resumeText: string;
  jobDescription?: string;
}) {
  const safeResume = sanitizeForLLM(resumeText);
  const safeJD = sanitizeForLLM(jobDescription || "");

  const prompt = buildPrompt(safeResume, safeJD);

  const html = await generateRawAnalysisText("gemini", prompt);

  return {
    htmlReport: html,
  };
}