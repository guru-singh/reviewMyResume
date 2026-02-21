import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { extractTextFromResume } from "@/lib/parseResume";
import { analyzeResumeWithLLM } from "@/lib/llm";

export const runtime = "nodejs";

const BodySchema = z.object({
  jobDescription: z.string().max(12000).optional().or(z.literal("")),
});

const FREE_LIMIT = 5;

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient();
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

    // Check subscription
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
            error: `Free limit reached (${FREE_LIMIT}). Please subscribe for unlimited analyses.`,
            code: "LIMIT_REACHED",
          },
          { status: 402 }
        );
      }
    }

    // Parse resume
    const resumeText = await extractTextFromResume(file);

    // LLM analysis
    const analysis = await analyzeResumeWithLLM({
      resumeText,
      jobDescription: parsedJD || undefined,
    });

    // Persist
    const { data: inserted, error: insertErr } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        filename: file.name,
        resume_text: resumeText,
        job_description: parsedJD || null,
        ats_score: analysis.atsScore,
        result: analysis,
      })
      .select("id, created_at")
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      id: inserted.id,
      createdAt: inserted.created_at,
      analysis,
    });
  } catch (err: any) {
    const msg = err?.message ?? "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
