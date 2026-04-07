import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { extractTextFromResume } from "@/lib/parseResume";
import { analyzeResumeWithLLM } from "@/lib/llm";
import { getErrorMessage } from "@/lib/getErrorMessage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    //const supabase = createSupabaseServerClient({ request: req });
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
    const parsedJobDescription =
      typeof jobDescription === "string" ? jobDescription.trim() : "";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Resume file required" }, { status: 400 });
    }

    // Razorpay and paywall checks are temporarily disabled.

    const resumeText = await extractTextFromResume(file);
    const { htmlReport } = await analyzeResumeWithLLM({
      resumeText,
      jobDescription: parsedJobDescription || undefined,
    });

    const { error: insertErr } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        filename: file.name,
        resume_text: resumeText,
        job_description: parsedJobDescription || null,
        ats_score: 0,
        result: {
          mode: "html",
          htmlReport,
        },
      });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return new NextResponse(htmlReport, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
