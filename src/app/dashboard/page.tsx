"use client";

import * as React from "react";
import Link from "next/link";
import { ResumeDropzone } from "@/components/ResumeDropzone";
import { Button, Card, CardContent, CardHeader, Textarea } from "@/components/ui";
import { getErrorMessage } from "@/lib/getErrorMessage";

type MeResponse = {
  user: { id: string; email: string | null; name?: string | null } | null;
  profile: { plan: string; subscription_status: string };
  usage: { used: number; limit: number; remaining: number };
};

const previewHtmlReport = `
<section>
  <h2>ATS Score</h2>
  <p><strong>82</strong> out of 100</p>
</section>
<section>
  <h2>Keyword Match</h2>
  <h3>Matched</h3>
  <ul>
    <li>Stakeholder management</li>
    <li>Roadmap planning</li>
    <li>Cross-functional delivery</li>
  </ul>
  <h3>Missing</h3>
  <ul>
    <li>Program governance</li>
    <li>Budget ownership</li>
    <li>Vendor management</li>
  </ul>
</section>
<section>
  <h2>Improvements</h2>
  <ul>
    <li>Make your top bullets more measurable.</li>
    <li>Tighten the summary for faster impact.</li>
  </ul>
</section>
<section>
  <h2>Upgrades</h2>
  <ul>
    <li>Use stronger ownership verbs.</li>
    <li>Mirror role language more closely.</li>
  </ul>
</section>
<section>
  <h2>Quick Wins</h2>
  <ul>
    <li>Add missing target keywords.</li>
    <li>Highlight scope and delivery outcomes.</li>
  </ul>
</section>
`;

export default function DashboardPage() {
  const [me, setMe] = React.useState<MeResponse | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [jobDescription, setJobDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [htmlReport, setHtmlReport] = React.useState<string | null>(null);

  async function loadMe() {
    const res = await fetch("/api/me", { cache: "no-store" });
    const data = (await res.json()) as MeResponse;
    setMe(data);
  }

  React.useEffect(() => {
    void loadMe();
  }, []);

  async function runAnalysis() {
    setError(null);
    setHtmlReport(null);

    if (!file) {
      setError("Please upload a resume (PDF/DOCX)");
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("resume", file);
      form.append("jobDescription", jobDescription);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: form,
      });

      const responseText = await res.text();
      const isHtml =
        (res.headers.get("content-type") || "").toLowerCase().includes("text/html");

      if (isHtml) {
        setHtmlReport(responseText);
      } else {
        setHtmlReport(buildRawResponsePreview(responseText, res.status, res.ok));
      }

      await loadMe();
    } catch (err: unknown) {
      setHtmlReport(
        buildRawResponsePreview(getErrorMessage(err, "Something went wrong"), 0, false)
      );
    } finally {
      setLoading(false);
    }
  }

  const displayName = me?.user?.name || me?.user?.email || "there";
  const paidActive =
    me?.profile?.plan === "paid" && me?.profile?.subscription_status === "active";
  const usageUsed = me?.usage?.used ?? 0;
  const usageLimit = me?.usage?.limit ?? 5;
  const usagePercent = Math.min(100, (usageUsed / Math.max(usageLimit, 1)) * 100);
  const freeLimitReached = !paidActive && usageUsed >= usageLimit;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f3f6fa_0%,#f7f1e8_100%)] text-slate-950">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#162238_0%,#1f3558_52%,#0e1828_100%)] px-5 py-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.2)] sm:px-6 lg:px-8">
          <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-[#ffd166]/18 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-sky-300/10 blur-3xl" />
          <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">
                Resume workspace
              </div>
              <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
                Turn every resume upload into a sharper next version.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                Welcome back, {displayName}. This page is focused on one workflow: upload your
                resume, run analysis, and review the results right away.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <TopPill label="Plan" value={paidActive ? "Paid" : "Free"} />
                <TopPill
                  label="Usage"
                  value={paidActive ? "Unlimited" : `${usageUsed}/${usageLimit} used`}
                />
                <TopPill label="Report" value={htmlReport ? "Ready" : "Waiting"} />
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/8 p-5 backdrop-blur">
                <div className="text-sm font-semibold text-white">What the report includes</div>
                <div className="mt-4 grid gap-3">
                  <FeatureRowDark title="ATS score" desc="A fast read on screening readiness." />
                  <FeatureRowDark title="Matched keywords" desc="Terms already aligned with the target role." />
                  <FeatureRowDark title="Missing keywords" desc="Important terms that may need stronger coverage." />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
            <CardHeader className="border-b border-slate-200 px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-950">New analysis</div>
                  <div className="text-sm leading-6 text-slate-600">
                    Upload your resume first. Add the job description if you want more precise
                    keyword matching.
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  {file?.name ?? "No resume uploaded"}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 px-6 py-6 sm:px-8">
              <ResumeDropzone value={file} onChange={setFile} />
              <Textarea
                label="Job description (optional)"
                rows={8}
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="rounded-2xl border-neutral-300 px-4 py-3"
              />
              {freeLimitReached ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Continue with payment
                  </Link>
                  <div className="text-sm text-slate-500">
                    Your 5 free trials are over. Upgrade to unlock more analyses.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button onClick={runAnalysis} isLoading={loading} className="rounded-2xl px-5 py-3">
                    Analyze resume
                  </Button>
                  <div className="text-sm text-slate-500">
                    PDF and DOCX supported. Results appear right below.
                  </div>
                </div>
              )}
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div
              id="payment-options"
              className="rounded-[1.8rem] bg-[#162238] p-5 text-white shadow-[0_16px_40px_rgba(15,23,42,0.14)]"
            >
              <div className="text-sm font-semibold">Access status</div>
              {freeLimitReached ? (
                <>
                  <div className="mt-2 text-2xl font-semibold">Free trials finished</div>
                  <div className="mt-2 text-sm leading-6 text-slate-200">
                    You have used all 5 free analyses. Use the payment flow to continue reviewing
                    more resumes.
                  </div>
                  <div className="mt-4">
                    <Link
                      href="/pricing"
                      className="inline-flex items-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                    >
                      Open payment options
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-2 text-2xl font-semibold">
                    {paidActive ? "Unlimited analyses active" : "Free trials available"}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-200">
                    {paidActive
                      ? "Your paid plan is active, so you can keep running analyses without a limit."
                      : `You can analyze up to ${usageLimit} resumes for free before payment is required.`}
                  </div>
                </>
              )}
              <div className="mt-4 rounded-2xl bg-white/10 px-4 py-4">
                <div className="flex items-center justify-between text-sm text-slate-200">
                  <span>Usage history</span>
                  <span>{usageUsed}/{usageLimit}</span>
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-white/10">
                  <div
                    className="h-2.5 rounded-full bg-[linear-gradient(90deg,#ffd166_0%,#f59e0b_100%)]"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {htmlReport ? (
            <HtmlReport report={htmlReport} />
          ) : (
            <div className="space-y-4">
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 px-6 py-5 text-sm text-slate-500">
                Results will appear in this section right after analysis. Preview shown below.
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-0 z-10 rounded-[2rem] bg-white/45 backdrop-blur-[1px]" />
                <div className="relative z-0 overflow-hidden rounded-[2rem]">
                  <HtmlReport report={previewHtmlReport} preview />
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function buildRawResponsePreview(body: string, status: number, ok: boolean) {
  const escaped = escapeHtml(body || "(empty response)");
  const label = status > 0 ? `${status} ${ok ? "OK" : "ERROR"}` : "REQUEST ERROR";

  return `
    <section>
      <h1>Raw Response</h1>
      <p><strong>Status:</strong> ${label}</p>
      <pre>${escaped}</pre>
    </section>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function HtmlReport({ report, preview = false }: { report: string; preview?: boolean }) {
  return (
    <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
      <CardHeader className="border-b border-slate-200 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-950">
              {preview ? "Report preview" : "Report"}
            </div>
            <div className="text-sm text-slate-600">Rendered directly from the Gemini HTML response.</div>
          </div>
          {preview ? (
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Example layout
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-6 py-6 sm:px-8">
        <div
          className="prose prose-slate max-w-none [&_section]:mb-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:text-slate-700 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:text-slate-700"
          dangerouslySetInnerHTML={{ __html: report }}
        />
      </CardContent>
    </Card>
  );
}

function TopPill(props: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white">
      <span className="text-slate-300">{props.label}: </span>
      <span className="font-semibold">{props.value}</span>
    </div>
  );
}

function FeatureRowDark(props: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/20 px-4 py-4">
      <div className="text-sm font-semibold text-white">{props.title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-200">{props.desc}</div>
    </div>
  );
}

// Razorpay checkout is intentionally disabled for now.
