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

const FREE_LIMIT = 5;

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
    const bypassAI = shouldBypassAI();
    const supabase = createSupabaseServerClient({ request: req });
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, subscription_status")
      .eq("id", user.id)
      .maybeSingle();

    const isPaidActive = profile?.plan === "paid" && profile?.subscription_status === "active";

    if (!isPaidActive) {
      const { count } = await supabase
        .from("analyses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if ((count ?? 0) >= FREE_LIMIT) {
        return NextResponse.json(
          {
            error: `Free limit reached (${FREE_LIMIT}). Please upgrade to continue.`,
            code: "LIMIT_REACHED",
          },
          { status: 402 }
        );
      }
    }

    const resumeText = await extractTextFromResume(file);

    const { error: insertErr } = await supabase.from("analyses").insert({
      user_id: user.id,
      filename: file.name,
      resume_text: resumeText,
      job_description: parsedJD || null,
      ats_score: 76,
      result: {
        mode: bypassAI ? "test" : "live",
        status: "queued",
      },
    });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    if (bypassAI) {
      return new NextResponse(TEST_HTML_REPORT, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const { analyzeResumeWithLLM } = await import("@/lib/llm");
    const llmResult = await analyzeResumeWithLLM({
      resumeText,
      jobDescription: parsedJD || undefined,
    });

    return new NextResponse(llmResult.htmlReport, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[api/analyze error]", error);
    const msg = getErrorMessage(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
