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

const TEST_HTML_REPORT = `
<section>
  <h1>Dummy Report</h1>
  <p>This is a bypassed AI response for UI and payment flow testing.</p>
</section>
<section>
  <h2>ATS Score</h2>
  <p><strong>76</strong> out of 100</p>
</section>
<section>
  <h2>Keyword Match</h2>
  <h3>Matched</h3>
  <ul>
    <li>Project Management</li>
    <li>Cross-functional teams</li>
    <li>Stakeholders</li>
  </ul>
  <h3>Missing</h3>
  <ul>
    <li>Business operations</li>
    <li>Market trends</li>
    <li>Research and analysis</li>
  </ul>
</section>
<section>
  <h2>Improvements</h2>
  <ul>
    <li>Make your top bullets more outcome-driven.</li>
    <li>Tighten the summary to highlight scope faster.</li>
  </ul>
</section>
<section>
  <h2>Upgrades</h2>
  <ul>
    <li>Add more measurable achievements.</li>
    <li>Use stronger ownership verbs.</li>
  </ul>
</section>
<section>
  <h2>Quick Wins</h2>
  <ul>
    <li>Mirror role keywords more directly.</li>
    <li>Clarify project scale and team size.</li>
  </ul>
</section>
`;

export async function POST(req: Request) {
  try {
    console.error("=== ANALYZE COOKIE CHECK START ===");
    console.error("=== ANALYZE COOKIE CHECK END ===");

    const bypassAI = shouldBypassAI();
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("resume");
    const jobDescription = form.get("jobDescription");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Resume file required" }, { status: 400 });
    }

    const parsedJD = BodySchema.parse({
      jobDescription: typeof jobDescription === "string" ? jobDescription : "",
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
    const nowIso = new Date().toISOString();

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

      const { error: analysisUpdateError } = await supabase
        .from("analyses")
        .update({
          status: "success",
          html_report: finalHtmlReport,
          error_message: null,
          result: {
            mode: bypassAI ? "test" : "live",
            status: "success",
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", analysisRow.id);

      if (analysisUpdateError) {
        return NextResponse.json(
          { error: "Analysis completed but failed to save report." },
          { status: 500 }
        );
      }

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          tokens_left: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileUpdateError) {
        return NextResponse.json(
          { error: "Analysis completed but failed to update token balance." },
          { status: 500 }
        );
      }

      const { error: tokenTxnError } = await supabase
        .from("token_transactions")
        .insert({
          user_id: user.id,
          delta: -1,
          balance_after: newBalance,
          source_type: "analysis",
          source_id: analysisRow.id,
          note: `Consumed 1 token for analysis: ${file.name}`,
        });

      if (tokenTxnError) {
        return NextResponse.json(
          { error: "Analysis completed but failed to write token ledger." },
          { status: 500 }
        );
      }

      return new NextResponse(finalHtmlReport, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    } catch (llmError) {
      console.error("=== ANALYZE LLM ERROR START ===");
      console.error(llmError);
      console.error("LLM ERROR MESSAGE:", getErrorMessage(llmError));
      console.error("=== ANALYZE LLM ERROR END ===");

      await supabase
        .from("analyses")
        .update({
          status: "failed",
          error_message: getErrorMessage(llmError),
          result: {
            mode: bypassAI ? "test" : "live",
            status: "failed",
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", analysisRow.id);

      return NextResponse.json(
        { error: getErrorMessage(llmError, "Analysis failed.") },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("=== ANALYZE ROUTE ERROR START ===");
    console.error(error);
    console.error("ERROR MESSAGE:", getErrorMessage(error));
    console.error("=== ANALYZE ROUTE ERROR END ===");
    console.error("[api/analyze error]", error);

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}