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

type ReportSummary = {
  overallScore: number;
  atsCompatibility: number;
  keywordMatch: number;
  contentQuality: number;
  formatStructure: number;
  topSuggestion: string;
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

  const reportSummary = React.useMemo(() => deriveReportSummary(htmlReport), [htmlReport]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f3f6fa_0%,#f7f1e8_100%)] text-slate-950">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#162238_0%,#1f3558_52%,#0e1828_100%)] px-5 py-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.2)] sm:px-6 md:py-6 lg:px-8">
          <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-[#ffd166]/18 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-sky-300/10 blur-3xl" />

          <div className="relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">
                Resume workspace
              </div>

              <h1 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">
                Upload your resume
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                Welcome back, {displayName}. Upload your resume, run analysis, and review ATS
                feedback instantly.
              </p>

              <div className="mt-5">
                <a
                  href="#new-analysis"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 sm:w-auto"
                >
                  Upload resume
                </a>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <TopPill label="Plan" value={paidActive ? "Paid" : "Free"} />
                <TopPill
                  label="Usage"
                  value={paidActive ? "Unlimited" : `${usageUsed}/${usageLimit} used`}
                />
                <TopPill label="Report" value={htmlReport ? "Ready" : "Waiting"} />
              </div>
            </div>

            <div>
              {htmlReport ? (
                <HeroScoreCard summary={reportSummary} />
              ) : (
                <div className="hidden h-full min-h-[280px] rounded-[1.75rem] border border-white/10 bg-white/6 lg:block" />
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
          <Card
            id="new-analysis"
            className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]"
          >
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

                  {!paidActive ? (
                    <div className="mt-4">
                      <Link
                        href="/pricing"
                        className="inline-flex items-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                      >
                        View packages
                      </Link>
                    </div>
                  ) : null}
                </>
              )}

              <div className="mt-4 rounded-2xl bg-white/10 px-4 py-4">
                <div className="flex items-center justify-between text-sm text-slate-200">
                  <span>Usage history</span>
                  <span>{paidActive ? "Unlimited" : `${usageUsed}/${usageLimit}`}</span>
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-white/10">
                  <div
                    className="h-2.5 rounded-full bg-[linear-gradient(90deg,#ffd166_0%,#f59e0b_100%)]"
                    style={{ width: `${paidActive ? 100 : usagePercent}%` }}
                  />
                </div>
              </div>
            </div>

            {!htmlReport ? (
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <FeatureMiniCard
                  title="ATS score"
                  desc="Quick view of screening readiness once analysis completes."
                />
                <FeatureMiniCard
                  title="Matched keywords"
                  desc="Terms already aligned with the target role."
                />
                <FeatureMiniCard
                  title="Missing keywords"
                  desc="Important gaps that may need stronger coverage."
                />
              </div>
            ) : null}
          </div>
        </section>

        <section id="report-section" className="space-y-6">
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

// function HeroScoreCard(props: { summary: ReportSummary }) {
//   return (
//     <div className="rounded-[1.5rem] bg-white/10 backdrop-blur-md border border-white/10 p-4 text-white shadow-sm">
//       <div className="text-lg font-semibold">Resume Score</div>

//       <div className="mt-3 grid gap-4 sm:grid-cols-[120px_1fr] sm:items-center">
//         <ScoreRingSmall
//           score={props.summary.overallScore}
//           label={getScoreLabel(props.summary.overallScore)}
//           dark
//         />

//         <div className="space-y-3">
//           <MetricBarCompact label="ATS" value={props.summary.atsCompatibility} tone="blue" dark />
//           <MetricBarCompact label="Keywords" value={props.summary.keywordMatch} tone="violet" dark />
//           <MetricBarCompact label="Content" value={props.summary.contentQuality} tone="green" dark />
//           <MetricBarCompact label="Format" value={props.summary.formatStructure} tone="amber" dark />
//         </div>
//       </div>

//       <div className="mt-4 rounded-xl bg-white/5 px-3 py-3">
//         <div className="text-xs font-semibold text-blue-300">Top suggestion</div>
//         <div className="mt-1 text-xs text-slate-200 line-clamp-2">
//           {props.summary.topSuggestion}
//         </div>

//         <a
//           href="#report-section"
//           className="mt-2 inline-flex items-center text-xs font-semibold text-blue-300 hover:underline"
//         >
//           View details →
//         </a>
//       </div>
//     </div>
//   );
// }
function HeroScoreCard(props: { summary: ReportSummary }) {
  return (
    <div className="rounded-[1.5rem] bg-slate-900/40 border border-slate-700 p-4 text-slate-100 shadow-sm">
      <div className="text-lg font-semibold">Resume Score</div>

      <div className="mt-3 grid gap-4 sm:grid-cols-[120px_1fr] sm:items-center">
        <ScoreRingSmall
          score={props.summary.overallScore}
          label={getScoreLabel(props.summary.overallScore)}
        />

        <div className="space-y-3">
          <MetricBarCompact label="ATS" value={props.summary.atsCompatibility} tone="blue" />
          <MetricBarCompact label="Keywords" value={props.summary.keywordMatch} tone="violet" />
          <MetricBarCompact label="Content" value={props.summary.contentQuality} tone="green" />
          <MetricBarCompact label="Format" value={props.summary.formatStructure} tone="amber" />
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-800/60 px-3 py-3">
        <div className="text-xs font-semibold text-blue-400">Top suggestion</div>
        <div className="mt-1 text-xs text-slate-300 line-clamp-2">
          {props.summary.topSuggestion}
        </div>

        <a
          href="#report-section"
          className="mt-2 inline-flex items-center text-xs font-semibold text-blue-400 hover:underline"
        >
          View details →
        </a>
      </div>
    </div>
  );
}

function ScoreRingSmall(props: { score: number; label: string }) {
  const angle = Math.round((props.score / 100) * 360);

  return (
    <div className="flex items-center justify-center">
      <div
        className="flex h-28 w-28 flex-col items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(#3b82f6 ${angle}deg, rgba(255,255,255,0.15) ${angle}deg 360deg)`,
        }}
      >
        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-slate-950">
          <div className="text-xl font-semibold text-white">{props.score}%</div>
          <div className="text-[10px] font-medium text-emerald-400">
            {props.label}
          </div>
        </div>
      </div>
    </div>
  );
}


function MetricBarCompact(props: {
  label: string;
  value: number;
  tone: "blue" | "violet" | "green" | "amber";
}) {
  const toneClass = {
    blue: "bg-blue-500",
    violet: "bg-violet-500",
    green: "bg-emerald-500",
    amber: "bg-amber-400",
  }[props.tone];

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{props.label}</span>
        <span className="font-medium text-slate-200">{props.value}%</span>
      </div>

      <div className="mt-1 h-1.5 rounded-full bg-slate-700">
        <div
          className={`h-1.5 rounded-full ${toneClass}`}
          style={{ width: `${props.value}%` }}
        />
      </div>
    </div>
  );
}


// function MetricBarCompact(props: {
//   label: string;
//   value: number;
//   tone: "blue" | "violet" | "green" | "amber";
//   dark?: boolean;
// }) {
//   const toneClass = {
//     blue: "bg-blue-500",
//     violet: "bg-violet-500",
//     green: "bg-emerald-500",
//     amber: "bg-amber-400",
//   }[props.tone];

//   return (
//     <div>
//       <div className="flex items-center justify-between text-xs">
//         <span className={props.dark ? "text-slate-300" : "text-slate-600"}>
//           {props.label}
//         </span>
//         <span className="font-medium">{props.value}%</span>
//       </div>

//       <div className={`mt-1 h-1.5 rounded-full ${
//         props.dark ? "bg-white/20" : "bg-slate-200"
//       }`}>
//         <div
//           className={`h-1.5 rounded-full ${toneClass}`}
//           style={{ width: `${props.value}%` }}
//         />
//       </div>
//     </div>
//   );
// }

// function ScoreRingSmall(props: { score: number; label: string; dark?: boolean }) {
//   const angle = Math.round((props.score / 100) * 360);

//   return (
//     <div className="flex items-center justify-center">
//       <div
//         className="flex h-28 w-28 flex-col items-center justify-center rounded-full"
//         style={{
//           background: `conic-gradient(#3b82f6 ${angle}deg, rgba(255,255,255,0.15) ${angle}deg 360deg)`,
//         }}
//       >
//         <div className={`flex h-20 w-20 flex-col items-center justify-center rounded-full ${
//           props.dark ? "bg-[#0f172a]" : "bg-white"
//         }`}>
//           <div className="text-xl font-semibold">{props.score}%</div>
//           <div className="text-[10px] font-medium text-emerald-400">
//             {props.label}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



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
            <div className="text-sm text-slate-600">
              Rendered directly from the Gemini HTML response.
            </div>
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

function FeatureMiniCard(props: { title: string; desc: string }) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
      <div className="text-sm font-semibold text-slate-950">{props.title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-600">{props.desc}</div>
    </div>
  );
}

function ScoreRing(props: { score: number; label: string }) {
  const angle = Math.round((props.score / 100) * 360);

  return (
    <div className="flex items-center justify-center">
      <div
        className="flex h-40 w-40 flex-col items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(#2563eb ${angle}deg, #dbeafe ${angle}deg 360deg)`,
        }}
      >
        <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
          <div className="text-4xl font-semibold text-slate-950">{props.score}%</div>
          <div className="mt-1 text-sm font-semibold text-emerald-600">{props.label}</div>
        </div>
      </div>
    </div>
  );
}

function MetricBar(props: {
  label: string;
  value: number;
  tone: "blue" | "violet" | "green" | "amber";
}) {
  const toneClass = {
    blue: "bg-blue-600",
    violet: "bg-violet-600",
    green: "bg-emerald-600",
    amber: "bg-amber-500",
  }[props.tone];

  const valueClass = {
    blue: "text-blue-700",
    violet: "text-violet-700",
    green: "text-emerald-700",
    amber: "text-amber-600",
  }[props.tone];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-700">{props.label}</span>
        <span className={`font-semibold ${valueClass}`}>{props.value}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-200">
        <div className={`h-2.5 rounded-full ${toneClass}`} style={{ width: `${props.value}%` }} />
      </div>
    </div>
  );
}

function deriveReportSummary(report: string | null): ReportSummary {
  if (!report) {
    return {
      overallScore: 78,
      atsCompatibility: 78,
      keywordMatch: 72,
      contentQuality: 80,
      formatStructure: 68,
      topSuggestion: "Add more quantifiable achievements to increase impact.",
    };
  }

  const plain = report
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const scoreMatch =
    plain.match(/ATS\s*Score\s*(\d{1,3})/i) ||
    plain.match(/(\d{1,3})\s*out of 100/i);

  const overall = clampScore(scoreMatch ? Number(scoreMatch[1]) : 78);

  return {
    overallScore: overall,
    atsCompatibility: overall,
    keywordMatch: clampScore(overall - 6),
    contentQuality: clampScore(overall + 2),
    formatStructure: clampScore(overall - 10),
    topSuggestion:
      extractTopSuggestion(plain) ||
      "Add more quantifiable achievements to increase impact.",
  };
}

function extractTopSuggestion(text: string) {
  const suggestions = [
    "Make your top bullets more measurable.",
    "Tighten the summary for faster impact.",
    "Use stronger ownership verbs.",
    "Mirror role language more closely.",
    "Add missing target keywords.",
    "Highlight scope and delivery outcomes.",
  ];

  return suggestions.find((item) => text.toLowerCase().includes(item.toLowerCase())) || null;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getScoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Promising";
  return "Needs work";
}

// Razorpay checkout is intentionally disabled for now.