import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type Provider = "gemini" | "claude";

type LLMAnalysisResult = {
  htmlReport: string;
  debug?: {
    provider: Provider;
    rawPreview: string;
  };
  rawResponses: Partial<Record<Provider, string>>;
};

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
- In the ATS Score section, include the final numeric score clearly in plain text.
- In the Keyword Match section, include two lists: matched and missing.
- If some information is missing, still include the section and show an empty list or a short placeholder sentence.

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

export async function analyzeResumeWithLLM(args: {
  resumeText: string;
  jobDescription?: string;
}): Promise<LLMAnalysisResult> {
  const provider = (process.env.LLM_PROVIDER || "gemini").toLowerCase() as Provider;
  const fallbackProvider = (
    process.env.LLM_FALLBACK_PROVIDER ||
    (provider === "gemini" ? "claude" : "gemini")
  ).toLowerCase() as Provider;

  if (!isProvider(provider)) {
    throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
  }

  if (!isProvider(fallbackProvider)) {
    throw new Error(`Unsupported LLM_FALLBACK_PROVIDER: ${fallbackProvider}`);
  }

  const prompt = buildPrompt(args.resumeText, args.jobDescription);
  const configuredProviders = (
    provider === fallbackProvider ? [provider] : [provider, fallbackProvider]
  ).filter(isConfiguredProvider);

  const errors: string[] = [];
  const rawResponses: Partial<Record<Provider, string>> = {};

  if (configuredProviders.length === 0) {
    throw new Error(
      "No configured LLM providers. Add GEMINI_API_KEY or ANTHROPIC_API_KEY to continue."
    );
  }

  for (const currentProvider of configuredProviders) {
    try {
      const htmlReport = await generateRawAnalysisText(currentProvider, prompt);
      rawResponses[currentProvider] = htmlReport;

      if (!htmlReport.trim()) {
        throw new Error("Provider returned an empty response");
      }

      return {
        htmlReport,
        debug: {
          provider: currentProvider,
          rawPreview: htmlReport.slice(0, 1200),
        },
        rawResponses,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown LLM error";
      errors.push(`${currentProvider}: ${msg}`);
    }
  }

  throw new Error(`All LLM providers failed. ${errors.join(" | ")}`);
}

function isProvider(provider: string): provider is Provider {
  return provider === "gemini" || provider === "claude";
}

function isConfiguredProvider(provider: Provider) {
  if (provider === "gemini") {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  if (provider === "claude") {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  return false;
}

function normalizeGeminiModel(model: string) {
  return model.replace(/^models\//, "");
}

async function writeProviderLog(provider: Provider, responseText: string) {
  try {
    const dir = path.join(process.cwd(), ".llm-logs");
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${provider}-latest.txt`);
    await writeFile(file, responseText, "utf8");
  } catch (error) {
    console.error(`[${provider} log write failed]`, error);
  }
}

async function generateRawAnalysisText(provider: Provider, prompt: string) {
  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const apiVersion = process.env.GEMINI_API_VERSION || "v1beta";
    const model = normalizeGeminiModel(process.env.GEMINI_MODEL || "gemini-1.5-pro");
    const isGemini25Pro = /^gemini-2\.5-pro/i.test(model);
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 3200,
          responseMimeType: "text/plain",
          ...(isGemini25Pro
            ? {
                thinkingConfig: {
                  thinkingBudget: 128,
                },
              }
            : {}),
        },
      }),
    });

    const rawText = await resp.text();
    await writeProviderLog("gemini", rawText);

    if (!resp.ok) {
      throw new Error(`Gemini error: ${resp.status} ${rawText}`);
    }

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch (error) {
      console.error("[gemini raw parse failed]", rawText);
      throw new Error("Failed to parse Gemini response");
    }

    const html =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: any) => (typeof part?.text === "string" ? part.text : ""))
        .join("")
        .trim() || "";

    if (!html) {
      throw new Error("Gemini returned empty text");
    }

    return html;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  const model = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest";
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2400,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const rawText = await resp.text();
  await writeProviderLog("claude", rawText);

  if (!resp.ok) {
    throw new Error(`Claude error: ${resp.status} ${rawText}`);
  }

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch (error) {
    console.error("[claude raw parse failed]", rawText);
    throw new Error("Failed to parse Claude response");
  }

  const html =
    data?.content
      ?.map((item: any) => (typeof item?.text === "string" ? item.text : ""))
      .join("")
      .trim() || "";

  if (!html) {
    throw new Error("Claude returned empty text");
  }

  return html;
}