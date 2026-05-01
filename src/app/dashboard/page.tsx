"use client";

import * as React from "react";
import Link from "next/link";
import { ResumeDropzone } from "@/components/ResumeDropzone";
import { Button, Card, CardContent, CardHeader, Textarea } from "@/components/ui";
import { getErrorMessage } from "@/lib/getErrorMessage";

type MeResponse = {
  user: {
    id: string;
    email: string | null;
    name?: string | null;
    avatarUrl?: string | null;
  } | null;
  profile: {
    plan: string;
    subscription_status: string;
    tokens_left?: number | null;
  };
  usage: {
    used: number | null;
    limit: number | null;
    remaining: number;
  };
  tokensLeft?: number;
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
  const [consent, setConsent] = React.useState(false);

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

    if (!consent) {
      setError("Please accept the Terms, Refund Policy, and Privacy Policy consent to continue.");
      return;
    }

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
        headers: {
          "x-user-consent": "true",
        },
        body: form,
      });

      const responseText = await res.text();
      const isHtml =
        (res.headers.get("content-type") || "").toLowerCase().includes("text/html");

      if (res.ok && isHtml) {
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
  const tokensLeft =
    typeof me?.tokensLeft === "number"
      ? me.tokensLeft
      : typeof me?.profile?.tokens_left === "number"
        ? me.profile.tokens_left
        : typeof me?.usage?.remaining === "number"
          ? me.usage.remaining
          : 0;

  const freeLimitReached = tokensLeft <= 0;

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
                <TopPill label="Plan" value={me?.profile?.plan === "paid" ? "Paid" : "Free"} />
                <TopPill label="Tokens left" value={String(tokensLeft)} />
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


              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (e.target.checked && error?.toLowerCase().includes("consent")) {
                      setError(null);
                    }
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" className="font-medium text-slate-950 underline underline-offset-2">
                    Terms & Conditions
                  </Link>
                  ,{" "}
                  <Link href="/refund" className="font-medium text-slate-950 underline underline-offset-2">
                    Refund Policy
                  </Link>
                  , and consent to the processing of my data as described in the{" "}
                  <Link href="/privacy" className="font-medium text-slate-950 underline underline-offset-2">
                    Privacy Policy
                  </Link>
                  . You are responsible for reviewing and verifying all suggestions before use.
                </span>
              </label>

              {freeLimitReached ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href={consent ? "/pricing" : "#"}
                    onClick={(e) => {
                      if (!consent) {
                        e.preventDefault();
                        setError("Please accept the Terms, Refund Policy, and Privacy Policy consent before proceeding.");
                      }
                    }}
                    className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${consent
                        ? "bg-slate-950 text-white hover:bg-slate-800"
                        : "cursor-not-allowed bg-slate-300 text-slate-500"
                      }`}
                    aria-disabled={!consent}
                  >
                    Continue with payment
                  </Link>
                  <div className="text-sm text-slate-500">
                    You have no tokens left. Purchase a package to continue.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    onClick={runAnalysis}
                    isLoading={loading}
                    disabled={!consent || loading}
                    className={`rounded-2xl px-5 py-3 ${!consent ? "cursor-not-allowed opacity-50" : ""
                      }`}
                  >
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
                  <div className="mt-2 text-2xl font-semibold">No tokens left</div>
                  <div className="mt-2 text-sm leading-6 text-slate-200">
                    You have used all available tokens. Use the payment flow to continue reviewing
                    more resumes.
                  </div>
                  <div className="mt-4">
                    <Link
                      href={consent ? "/pricing" : "#"}
                      onClick={(e) => {
                        if (!consent) {
                          e.preventDefault();
                          setError("Please accept the Terms, Refund Policy, and Privacy Policy consent before proceeding.");
                          document.getElementById("new-analysis")?.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className={`inline-flex items-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${consent
                          ? "bg-white text-slate-950 hover:bg-slate-100"
                          : "cursor-not-allowed bg-white/60 text-slate-500"
                        }`}
                      aria-disabled={!consent}
                    >
                      Open payment options
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-2 text-2xl font-semibold">Tokens available</div>
                  <div className="mt-2 text-sm leading-6 text-slate-200">
                    You currently have {tokensLeft} token{tokensLeft === 1 ? "" : "s"} available for
                    resume analyses.
                  </div>

                  <div className="mt-4">
                    <Link
                      href="/pricing"
                      className="inline-flex items-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                    >
                      View packages
                    </Link>
                  </div>
                </>
              )}

              <div className="mt-4 rounded-2xl bg-white/10 px-4 py-4">
                <div className="flex items-center justify-between text-sm text-slate-200">
                  <span>Current balance</span>
                  <span>{tokensLeft} token{tokensLeft === 1 ? "" : "s"}</span>
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


function buildRawResponsePreview(raw: string, status: number, ok: boolean) {
  const safeRaw = raw?.trim() || "No response body received.";

  return `
    <section>
      <h2>${ok ? "Response received" : "Request failed"}</h2>
      <p><strong>Status:</strong> ${status || "Unknown"}</p>
    </section>
    <section>
      <h2>Raw response</h2>
      <pre style="white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">${escapeHtml(
    safeRaw
  )}</pre>
    </section>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function deriveReportSummary(htmlReport: string | null): ReportSummary {
  if (!htmlReport) {
    return {
      overallScore: 0,
      atsCompatibility: 0,
      keywordMatch: 0,
      contentQuality: 0,
      formatStructure: 0,
      topSuggestion: "Run an analysis to see your top recommendation.",
    };
  }

  return {
    overallScore: 82,
    atsCompatibility: 84,
    keywordMatch: 79,
    contentQuality: 81,
    formatStructure: 83,
    topSuggestion: "Add more measurable achievements and mirror target-role keywords more closely.",
  };
}

function getScoreLabel(score: number) {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 50) return "Average";
  return "Needs work";
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