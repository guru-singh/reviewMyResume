import "@/lib/filterDeprecations";
import "@/lib/ensureSafeBuffer";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { extractTextFromResume } from "@/lib/parseResume";
import { getErrorMessage } from "@/lib/getErrorMessage";

export const runtime = "nodejs";

const BodySchema = z.object({
  jobDescription: z.string().max(12000).optional().or(z.literal("")),
});

function shouldBypassAI() {
  return (process.env.BOOL_BYPASS_AI || "").trim().toLowerCase() === "true";
}

const TEST_HTML_REPORT = `...`; // keep your existing HTML

export async function POST(req: Request) {
  try {
    /**
     * ✅ STEP 1: API-level consent check
     */
    const userConsent = req.headers.get("x-user-consent");

    if (userConsent !== "true") {
      return NextResponse.json(
        {
          error:
            "Consent required. Please accept Terms, Privacy Policy, and Refund Policy before analysis.",
          code: "CONSENT_REQUIRED",
        },
        { status: 400 }
      );
    }

    const bypassAI = shouldBypassAI();
    const supabase = await createSupabaseServerClient();

    /**
     * ✅ STEP 2: Auth check
     */
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /**
     * ✅ STEP 3: Store consent in DB
     */
    const nowIso = new Date().toISOString();

    const consentText =
      "I agree to the Terms & Conditions and Refund Policy, and consent to the processing of my data as described in the Privacy Policy. I understand that I am responsible for reviewing and verifying all suggestions before use.";

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const userAgent = req.headers.get("user-agent");

    const { error: consentInsertError } = await supabase
      .from("user_consents")
      .insert({
        user_id: user.id,
        consent_type: "resume_analysis",
        terms_version: "v1",
        privacy_version: "v1",
        refund_version: "v1",
        consent_text: consentText,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: nowIso,
      });

    if (consentInsertError) {
      console.error("Consent insert error:", consentInsertError);

      return NextResponse.json(
        { error: "Failed to record consent. Please try again." },
        { status: 500 }
      );
    }

    /**
     * ✅ STEP 4: Continue your existing logic
     */
    const form = await req.formData();
    const file = form.get("resume");
    const jobDescription = form.get("jobDescription");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Resume file required" },
        { status: 400 }
      );
    }

    const parsedJD = BodySchema.parse({
      jobDescription:
        typeof jobDescription === "string" ? jobDescription : "",
    }).jobDescription;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, tokens_left")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found." },
        { status: 500 }
      );
    }

    const currentTokens =
      typeof profile.tokens_left === "number" ? profile.tokens_left : 0;

    if (currentTokens <= 0) {
      return NextResponse.json(
        {
          error: "No tokens left. Please purchase more to continue.",
          code: "LIMIT_REACHED",
        },
        { status: 402 }
      );
    }

    const resumeText = await extractTextFromResume(file);

    const { data: analysisRow, error: insertErr } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        filename: file.name,
        resume_text: resumeText,
        job_description: parsedJD || null,
        ats_score: 76,
        status: "queued",
        html_report: null,
        error_message: null,
        result: {
          mode: bypassAI ? "test" : "live",
          status: "queued",
          consent: true,
          consent_at: nowIso,
        },
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("id")
      .single();

    if (insertErr || !analysisRow) {
      return NextResponse.json(
        { error: insertErr?.message || "Failed to create analysis record." },
        { status: 500 }
      );
    }

    let finalHtmlReport = TEST_HTML_REPORT;

    try {
      if (!bypassAI) {
        const { analyzeResumeWithLLM } = await import("@/lib/llm");
        const llmResult = await analyzeResumeWithLLM({
          resumeText,
          jobDescription: parsedJD || undefined,
        });

        finalHtmlReport = llmResult.htmlReport;
      }

      const newBalance = currentTokens - 1;

      await supabase
        .from("analyses")
        .update({
          status: "success",
          html_report: finalHtmlReport,
          updated_at: new Date().toISOString(),
        })
        .eq("id", analysisRow.id);

      await supabase
        .from("profiles")
        .update({
          tokens_left: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      await supabase.from("token_transactions").insert({
        user_id: user.id,
        delta: -1,
        balance_after: newBalance,
        source_type: "analysis",
        source_id: analysisRow.id,
        note: `Consumed 1 token for analysis: ${file.name}`,
      });

      return new NextResponse(finalHtmlReport, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    } catch (llmError) {
      await supabase
        .from("analyses")
        .update({
          status: "failed",
          error_message: getErrorMessage(llmError),
          updated_at: new Date().toISOString(),
        })
        .eq("id", analysisRow.id);

      return NextResponse.json(
        { error: getErrorMessage(llmError, "Analysis failed.") },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}