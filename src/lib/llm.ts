import { z } from "zod";

export const ResumeAnalysisSchema = z.object({
  atsScore: z.number().min(0).max(100),
  keywordMatch: z
    .object({
      matched: z.array(z.string()).default([]),
      missing: z.array(z.string()).default([]),
    })
    .optional(),
  improvements: z.array(
    z.object({
      title: z.string(),
      details: z.array(z.string()).default([]),
    })
  ),
  upgrades: z.object({
    summary: z.array(z.string()).default([]),
    experienceBullets: z
      .array(
        z.object({
          original: z.string(),
          rewritten: z.string(),
        })
      )
      .default([]),
    skills: z.array(z.string()).default([]),
  }),
  quickWins: z.array(z.string()).default([]),
});

export type ResumeAnalysis = z.infer<typeof ResumeAnalysisSchema>;
type Provider = "gemini" | "claude";

function buildPrompt(resumeText: string, jobDescription?: string) {
  return `You are an expert ATS resume reviewer.

Return ONLY valid JSON matching this TypeScript type (no markdown, no backticks):

type Output = {
  atsScore: number; // 0-100
  keywordMatch?: { matched: string[]; missing: string[] };
  improvements: { title: string; details: string[] }[];
  upgrades: {
    summary: string[];
    experienceBullets: { original: string; rewritten: string }[];
    skills: string[];
  };
  quickWins: string[];
}

Scoring guidance:
- Penalize missing keywords, weak impact, passive language, poor formatting for ATS.
- If a job description is provided, include keywordMatch and weight to role relevance.

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
}) {
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
  const providers: Provider[] =
    provider === fallbackProvider ? [provider] : [provider, fallbackProvider];
  const errors: string[] = [];

  for (const p of providers) {
    try {
      const rawText = await generateRawAnalysisText(p, prompt);
      const parsed = parseLLMJson(rawText);
      return ResumeAnalysisSchema.parse(parsed);
    } catch (err: any) {
      const msg = err?.message ?? "Unknown LLM error";
      errors.push(`${p}: ${msg}`);
    }
  }

  throw new Error(`All LLM providers failed. ${errors.join(" | ")}`);
}

function isProvider(provider: string): provider is Provider {
  return provider === "gemini" || provider === "claude";
}

function parseLLMJson(rawText: string): unknown {
  // Some providers still return stringified JSON.
  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

async function generateRawAnalysisText(provider: Provider, prompt: string) {
  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    // NOTE: Gemini model names evolve. Configure via env if needed.
    const model = process.env.GEMINI_MODEL || "gemini-1.5-pro";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1800,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Gemini error: ${resp.status} ${t}`);
    }

    const data = await resp.json();
    return (
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join("") ?? ""
    );
  }

  if (provider === "claude") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

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
        max_tokens: 1800,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Claude error: ${resp.status} ${t}`);
    }

    const data = await resp.json();
    return data?.content?.map((c: any) => c?.text).join("") ?? "";
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
